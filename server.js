/**
 * IPL Auction 3D - Multiplayer server (plain Node.js, no packages to install).
 * The server owns purses, squads, bids and the lot clock. Phones get every change pushed
 * instantly over Server-Sent Events; actions come in as POST /api.
 * Rooms live in memory: if the host restarts, rooms are gone (free hosts also sleep when idle).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TEAM_IDS = ['mi','csk','rcb','kkr','dc','pbks','rr','srh','gt','lsg'];
const DEFSQ = 25, SQ_OPTS = [15, 18, 21, 25], OSL = 5, PURSE = 100;
const msq = s => s.maxsq || DEFSQ;
const BID_MS = 10000, BUMP_MS = 10000, RES_MS = 3000, TRADE_TTL = 90000;

const DATA=`Tim David|BAT|AUS|1.0|82||rcb|16|1|1
Venkatesh Iyer|AR|IND|1.0|79|M|rcb|16|1|1
Virat Kohli|BAT|IND|2.0|95||rcb|16|1|1
Bhuvneshwar Kumar|BOWL|IND|1.0|80|M|rcb|16|1|1
Devdutt Padikkal|BAT|IND|0.5|75||rcb|16|1|1
Krunal Pandya|AR|IND|0.75|76|S|rcb|16|1|1
Rasikh Salam|BOWL|IND|0.5|70|M|rcb|16|0|1
Jitesh Sharma|WK|IND|0.5|74||rcb|16|1|1
Romario Shepherd|AR|WI|0.75|76|F|rcb|16|0|1
Rajat Patidar|BAT|IND|0.75|78||rcb|15|1|1
Suyash Sharma|BOWL|IND|0.5|72|S|rcb|14|0|1
Josh Hazlewood|BOWL|AUS|1.5|86|F|rcb|13|1|1
Jordan Cox|WK|ENG|0.5|74||rcb|12|0|1
Jacob Bethell|AR|ENG|0.75|77|S|rcb|11|0|1
Mangesh Yadav|AR|IND|0.5|72|M|rcb|9|0|1
Kanishk Chouhan|AR|IND|0.5|71|M|rcb|8|0|1
Abhinandan Singh|BOWL|IND|0.25|67|M|rcb|7|0|1
Jacob Duffy|BOWL|NZ|0.5|73|M|rcb|6|0|1
Phil Salt|WK|ENG|1.5|85||rcb|6|1|1
Swapnil Singh|AR|IND|0.5|69|S|rcb|6|0|1
Vicky Kanhaiya Ostwal|BOWL|IND|0.25|65|S|rcb|5|0|1
Yash Dayal|BOWL|IND|0.5|73|M|rcb|0|1|1
Satvik Deswal|BOWL|IND|0.25|60|M|rcb|0|0|1
Vihaan Manoj Malhotra|AR|IND|0.25|63|M|rcb|0|0|1
Nuwan Thushara|BOWL|SL|0.5|73|F|rcb|0|0|1
Jos Buttler|WK|ENG|2.0|90||gt|17|1|1
Jason Holder|AR|WI|0.75|76|M|gt|17|0|1
Rashid Khan|BOWL|AFG|2.0|93|S|gt|17|1|1
Glenn Phillips|AR|NZ|1.0|79|S|gt|17|0|1
Kagiso Rabada|BOWL|SA|1.5|87|F|gt|17|1|1
Mohammed Siraj|BOWL|IND|1.5|87|F|gt|17|1|1
Sai Sudharsan|BAT|IND|0.75|80||gt|17|1|1
Washington Sundar|AR|IND|1.0|80|S|gt|17|1|1
Rahul Tewatia|AR|IND|0.5|74|S|gt|17|1|1
Shubman Gill|BAT|IND|2.0|91||gt|16|1|1
Anuj Rawat|WK|IND|0.5|67||gt|16|0|1
Prasidh Krishna|BOWL|IND|1.0|79|F|gt|14|1|1
Nishant Sindhu|AR|IND|0.5|73|S|gt|11|0|1
Arshad Khan|AR|IND|0.5|68|M|gt|10|0|1
Kumar Kushagra|WK|IND|0.5|72||gt|10|0|1
Manav Suthar|BOWL|IND|0.5|70|S|gt|10|0|1
Shahrukh Khan|BAT|IND|0.5|73||gt|9|0|1
Kulwant Khejroliya|BOWL|IND|0.5|68|M|gt|8|0|1
Sai Kishore|BOWL|IND|0.75|77|S|gt|6|0|1
Ashok Sharma|BOWL|IND|0.25|66|M|gt|6|0|1
Jayant Yadav|BOWL|IND|0.5|68|S|gt|3|0|1
Tom Banton|BAT|ENG|0.5|72||gt|0|0|1
Gurnoor Brar|BOWL|IND|0.25|60|M|gt|0|0|1
Ishant Sharma|BOWL|IND|0.5|70|M|gt|0|0|1
Luke Wood|AR|ENG|0.5|74|F|gt|0|0|1
Salil Arora|BAT|IND|0.5|72||srh|15|0|1
Harsh Dubey|BOWL|IND|0.5|74|S|srh|15|0|1
Travis Head|BAT|AUS|2.0|90||srh|15|1|1
Ishan Kishan|WK|IND|1.5|82||srh|15|1|1
Heinrich Klaasen|WK|SA|2.0|91||srh|15|1|1
Shivang Kumar|BOWL|IND|0.5|74|S|srh|15|0|1
Liam Livingstone|AR|ENG|1.5|82|S|srh|15|1|1
Eshan Malinga|BOWL|SL|0.75|76|F|srh|15|0|1
Harshal Patel|BOWL|IND|0.75|77|M|srh|15|0|1
Abhishek Sharma|AR|IND|1.0|83|S|srh|15|1|1
Aniket Verma|BAT|IND|0.75|77||srh|15|0|1
Nitish Kumar Reddy|AR|IND|0.75|78|M|srh|14|1|1
Sakib Hussain|AR|IND|0.75|75|M|srh|13|0|1
Ravichandran Smaran|BAT|IND|0.75|75||srh|13|0|1
Praful Hinge|BOWL|IND|0.5|71|M|srh|12|0|1
Pat Cummins|BOWL|AUS|2.0|91|F|srh|8|1|1
Jaydev Unadkat|BOWL|IND|0.5|72|M|srh|4|0|1
Shivam Mavi|BOWL|IND|0.25|63|F|srh|3|0|1
David Payne|BOWL|ENG|0.25|63|M|srh|3|0|1
Zeeshan Ansari|BOWL|IND|0.25|62|S|srh|2|0|1
Dilshan Madushanka|BOWL|SL|0.5|72|F|srh|2|0|1
Kamindu Mendis|AR|SL|0.5|74|S|srh|1|0|1
Krains Bhaveshbhai Fuletra|BOWL|IND|0.25|60|M|srh|0|0|1
Brydon Carse|BOWL|ENG|0.75|76|F|srh|0|0|1
Amit Kumar|BOWL|IND|0.25|60|M|srh|0|0|1
Onkar Tarmale|BOWL|IND|0.25|60|M|srh|0|0|1
Jofra Archer|BOWL|ENG|1.5|85|F|rr|16|1|1
Ravi Bishnoi|BOWL|IND|0.75|78|S|rr|16|1|1
Donovan Ferreira|WK|SA|0.75|75||rr|16|0|1
Yashasvi Jaiswal|BAT|IND|1.5|90||rr|16|1|1
Dhruv Jurel|WK|IND|0.5|77||rr|16|1|1
Brijesh Sharma|BOWL|IND|0.5|73|S|rr|16|0|1
Vaibhav Suryavanshi|BAT|IND|0.5|74||rr|16|0|1
Shubham Dubey|BAT|IND|0.75|77||rr|15|0|1
Riyan Parag|BAT|IND|0.75|79||rr|15|1|1
Ravindra Jadeja|AR|IND|2.0|89|S|rr|14|1|1
Nandre Burger|BOWL|SA|0.75|76|F|rr|13|0|1
Tushar Deshpande|BOWL|IND|0.5|74|M|rr|13|0|1
Ravi Singh|WK|IND|0.5|74||rr|12|0|1
Shimron Hetmyer|BAT|WI|1.0|80||rr|10|1|1
Lhuan-dre Pretorius|WK|SA|0.5|72||rr|10|0|1
Yash Raj Punja|AR|IND|0.5|72|M|rr|10|0|1
Dasun Shanaka|AR|SL|0.5|73|M|rr|8|0|1
Sandeep Sharma|BOWL|IND|0.5|72|M|rr|8|0|1
Sushant Mishra|BOWL|IND|0.25|67|M|rr|7|0|1
Aman Rao Perala|BAT|IND|0.5|68||rr|5|0|1
Adam Milne|BOWL|NZ|0.75|75|F|rr|3|0|1
Yudhvir Singh Charak|BOWL|IND|0.25|61|M|rr|1|0|1
Kyle Jamieson|BOWL|NZ|0.75|75|F|dc|2|0|1
Kwena Maphaka|BOWL|SA|0.25|60|F|rr|0|0|1
Vignesh Puthur|AR|IND|0.25|63|S|rr|0|0|1
Kuldeep Sen|BOWL|IND|0.5|71|M|rr|0|0|1
Priyansh Arya|BAT|IND|0.5|74||pbks|14|0|1
Xavier Bartlett|BOWL|AUS|0.5|74|F|pbks|14|0|1
Harpreet Brar|BOWL|IND|0.5|72|S|pbks|14|0|1
Yuzvendra Chahal|BOWL|IND|1.5|86|S|pbks|14|1|1
Cooper Connolly|AR|AUS|0.75|77|S|pbks|14|0|1
Shreyas Iyer|BAT|IND|2.0|86||pbks|14|1|1
Suryansh Shedge|BAT|IND|0.75|76||pbks|14|0|1
Arshdeep Singh|BOWL|IND|1.5|85|F|pbks|14|1|1
Prabhsimran Singh|WK|IND|0.5|74||pbks|14|0|1
Vishnu Vinod|WK|IND|0.75|76||pbks|14|0|1
Marco Jansen|AR|SA|1.0|81|F|pbks|13|1|1
Marcus Stoinis|AR|AUS|1.0|82|M|pbks|13|1|1
Shashank Singh|AR|IND|0.5|76|M|pbks|12|1|1
Vijaykumar Vyshak|BOWL|IND|0.5|74|M|pbks|12|0|1
Nehal Wadhera|BAT|IND|0.5|74||pbks|9|1|1
Praveen Dubey|BOWL|IND|0.25|67|S|pbks|7|0|1
Yash Thakur|BOWL|IND|0.5|71|M|pbks|5|0|1
Musheer Khan|AR|IND|0.25|67|S|pbks|4|0|1
Lockie Ferguson|BOWL|NZ|1.0|79|F|pbks|3|1|1
Azmatullah Omarzai|AR|AFG|0.75|76|M|pbks|3|0|1
Mitchell Owen|AR|AUS|0.5|74|M|pbks|2|0|1
Ben Dwarshuis|BOWL|AUS|0.25|61|M|pbks|1|0|1
Pyla Avinash|BAT|IND|0.25|63||pbks|0|0|1
Vishal Nishad|BOWL|IND|0.25|60|S|pbks|0|0|1
Harnoor Singh|BAT|IND|0.25|63||pbks|0|0|1
David Miller|BAT|SA|1.5|82||dc|14|1|1
Axar Patel|AR|IND|1.5|86|S|dc|14|1|1
KL Rahul|WK|IND|2.0|88||dc|14|1|1
Sameer Rizvi|BAT|IND|0.5|72||dc|14|0|1
Ashutosh Sharma|BAT|IND|0.5|74||dc|14|0|1
Tristan Stubbs|WK|SA|0.75|79||dc|14|0|1
Vipraj Nigam|BOWL|IND|0.5|69|S|dc|13|0|1
Auqib Nabi|BOWL|IND|0.5|71|M|dc|12|0|1
Lungi Ngidi|BOWL|SA|0.75|77|F|dc|12|0|1
Pathum Nissanka|BAT|SL|0.5|73||dc|12|0|1
Nitish Rana|BAT|IND|0.5|73||dc|12|0|1
Kuldeep Yadav|BOWL|IND|1.5|88|S|dc|12|1|1
Karun Nair|BAT|IND|0.5|74||dc|11|1|1
T Natarajan|BOWL|IND|0.75|77|M|dc|11|1|1
Mukesh Kumar|BOWL|IND|0.75|76|M|dc|10|0|1
Dushmantha Chameera|BOWL|SL|0.5|73|F|dc|8|0|1
Abhishek Porel|WK|IND|0.5|72||dc|7|1|1
Mitchell Starc|BOWL|AUS|2.0|88|F|dc|6|1|1
Vijay Tripurana|AR|IND|0.5|68|S|dc|5|0|1
Sahil Parakh|BOWL|IND|0.25|64|S|dc|4|0|1
Madhav Tiwari|AR|IND|0.25|66|M|dc|3|0|1
Ben Duckett|BAT|ENG|0.5|73||dc|0|0|1
Ajay Mandal|AR|IND|0.25|63|S|dc|0|0|1
Prithvi Shaw|BAT|IND|0.5|73||dc|0|1|1
Finn Allen|BAT|NZ|0.5|74||kkr|14|0|1
Vaibhav Arora|BOWL|IND|0.5|74|M|kkr|14|0|1
Tejasvi Dahiya|WK|IND|0.75|76||kkr|14|0|1
Cameron Green|AR|AUS|1.5|83|M|kkr|14|1|1
Manish Pandey|BAT|IND|0.5|70||kkr|14|0|1
Rovman Powell|BAT|WI|0.75|76||kkr|14|0|1
Ajinkya Rahane|BAT|IND|0.75|74||kkr|14|0|1
Anukul Roy|AR|IND|0.75|76|S|kkr|14|0|1
Ramandeep Singh|BAT|IND|0.5|73||kkr|14|0|1
Rinku Singh|BAT|IND|1.0|84||kkr|14|1|1
Kartik Tyagi|BOWL|IND|0.5|72|F|kkr|14|0|1
Sunil Narine|BOWL|WI|1.5|88|S|kkr|13|1|1
Angkrish Raghuvanshi|BAT|IND|0.5|75||kkr|13|0|1
Varun Chakravarthy|BOWL|IND|1.0|83|S|kkr|11|1|1
Navdeep Saini|BOWL|IND|0.5|72|F|kkr|9|0|1
Tim Seifert|WK|NZ|0.5|72||kkr|8|0|1
Saurabh Dubey|BOWL|IND|0.25|67|S|kkr|7|0|1
Rahul Tripathi|BAT|IND|0.5|74||kkr|4|0|1
Blessing Muzarabani|BOWL|ZIM|0.25|63|F|kkr|3|0|1
Matheesha Pathirana|BOWL|SL|1.0|82|F|kkr|1|1|1
Sarthak Ranjan|BAT|IND|0.25|64||kkr|1|0|1
Daksh Kamra|AR|IND|0.25|63|M|kkr|0|0|1
Umran Malik|BOWL|IND|0.5|71|F|kkr|0|1|1
Mustafizur Rahman|BOWL|BAN|1.0|79|M|kkr|0|1|1
Rachin Ravindra|AR|NZ|1.0|80|S|kkr|0|1|1
Prashant Solanki|BOWL|IND|0.25|60|S|kkr|0|0|1
Noor Ahmad|BOWL|AFG|0.75|78|S|csk|14|1|1
Shivam Dube|AR|IND|1.0|81|M|csk|14|1|1
Ruturaj Gaikwad|BAT|IND|1.5|86||csk|14|1|1
Anshul Kamboj|BOWL|IND|0.5|72|M|csk|14|0|1
Sarfaraz Khan|BAT|IND|0.5|73||csk|14|0|1
Sanju Samson|WK|IND|2.0|87||csk|14|1|1
Kartik Sharma|WK|IND|0.75|76||csk|14|0|1
Matthew Short|AR|AUS|0.5|73|S|csk|14|0|1
Gurjapneet Singh|BOWL|IND|0.5|73|F|csk|14|0|1
Prashant Veer|AR|IND|0.75|75|S|csk|13|0|1
Dewald Brevis|BAT|SA|0.75|77||csk|11|0|1
Jamie Overton|BOWL|ENG|0.5|72|F|csk|11|0|1
Akeal Hosein|BOWL|WI|0.5|73|S|csk|10|0|1
Mukesh Choudhary|BOWL|IND|0.5|69|M|csk|9|0|1
Matt Henry|BOWL|NZ|0.75|76|M|csk|8|0|1
Urvil Patel|WK|IND|0.5|68||csk|8|0|1
Ramakrishna Ghosh|BOWL|IND|0.25|66|M|csk|6|0|1
Ayush Mhatre|AR|IND|0.5|69|M|csk|6|0|1
Khaleel Ahmed|BOWL|IND|0.5|74|M|csk|5|1|1
Spencer Johnson|BOWL|AUS|0.75|76|F|csk|3|0|1
Rahul Chahar|BOWL|IND|0.5|72|S|csk|2|0|1
Aman Hakim Khan|BOWL|IND|0.25|62|M|csk|2|0|1
Macneil Hadley Noronha|BAT|IND|0.25|64||csk|1|0|1
Akash Madhwal|BOWL|IND|0.25|61|M|csk|1|0|1
Kuldip Yadav|BOWL|IND|0.25|61|M|csk|1|0|1
Zak Foulkes|AR|NZ|0.25|63|M|csk|0|0|1
Shreyas Gopal|AR|IND|0.5|70|S|csk|0|0|1
Naman Dhir|BAT|IND|0.5|73||mi|14|0|1
Tilak Varma|BAT|IND|1.0|84||mi|14|1|1
Jasprit Bumrah|BOWL|IND|2.0|96|F|mi|13|1|1
Shardul Thakur|BOWL|IND|0.75|75|M|mi|13|1|1
Suryakumar Yadav|BAT|IND|2.0|93||mi|13|1|1
Raj Angad Bawa|AR|IND|0.5|72|M|mi|12|0|1
Ryan Rickelton|WK|SA|0.75|77||mi|12|0|1
Corbin Bosch|AR|SA|0.5|74|F|mi|11|0|1
Allah Ghazanfar|BOWL|AFG|0.5|73|S|mi|11|0|1
Robin Minz|WK|IND|0.5|68||mi|11|0|1
Trent Boult|BOWL|NZ|1.5|86|M|mi|10|1|1
Hardik Pandya|AR|IND|2.0|90|M|mi|10|1|1
Ashwani Kumar|BOWL|IND|0.5|72|M|mi|9|0|1
Mayank Rawat|AR|IND|0.5|72|S|mi|9|0|1
Raghu Sharma|AR|IND|0.5|72|S|mi|9|0|1
Rohit Sharma|BAT|IND|2.0|92||mi|9|1|1
Deepak Chahar|BOWL|IND|0.75|77|M|mi|8|1|1
Will Jacks|BAT|ENG|1.0|80||mi|8|1|1
Sherfane Rutherford|BAT|WI|0.75|77||mi|8|0|1
Krish Bhagat|BOWL|IND|0.25|67|M|mi|7|0|1
Mayank Markande|BOWL|IND|0.5|70|S|mi|4|0|1
Mitchell Santner|AR|NZ|0.75|77|S|mi|4|0|1
Quinton de Kock|WK|SA|1.5|85||mi|3|1|1
Danish Malewar|BAT|IND|0.25|65||mi|2|0|1
Atharva Ankolekar|BAT|IND|0.25|63||mi|0|0|1
Mohammed Salahuddin Izhar|BOWL|IND|0.25|60|M|mi|0|0|1
Rishabh Pant|WK|IND|2.0|90||lsg|14|1|1
Nicholas Pooran|WK|WI|1.5|87||lsg|14|1|1
Digvesh Rathi|BOWL|IND|0.5|70|S|lsg|14|0|1
Abdul Samad|AR|IND|0.5|72|S|lsg|14|0|1
Prince Yadav|BOWL|IND|0.5|74|F|lsg|14|0|1
Mukul D Choudhary|WK|IND|0.75|75||lsg|13|0|1
Mitchell Marsh|AR|AUS|1.0|80|M|lsg|13|1|1
Mohammed Shami|BOWL|IND|1.5|88|F|lsg|13|1|1
Manimaran Siddharth|BOWL|IND|0.5|71|S|lsg|13|0|1
Himmat Singh|BAT|IND|0.75|75||lsg|13|0|1
Aiden Markram|BAT|SA|1.0|80||lsg|12|1|1
Ayush Badoni|BAT|IND|0.5|75||lsg|11|1|1
Shahbaz Ahmed|AR|IND|0.5|73|S|lsg|10|0|1
Avesh Khan|BOWL|IND|0.5|74|M|lsg|10|1|1
Mayank Yadav|BOWL|IND|0.75|78|F|lsg|10|1|1
Mohsin Khan|BOWL|IND|0.5|73|M|lsg|7|0|1
Matthew Breetzke|BAT|SA|0.5|69||lsg|6|0|1
Josh Inglis|WK|AUS|1.0|78||lsg|5|0|1
Akshat Raghuwanshi|BAT|IND|0.5|68||lsg|5|0|1
George Linde|AR|SA|0.25|67|S|lsg|4|0|1
Arshin Kulkarni|AR|IND|0.25|66|M|lsg|3|0|1
Akash Maharaj Singh|BOWL|IND|0.25|63|M|lsg|3|0|1
Anrich Nortje|BOWL|SA|1.0|80|F|lsg|2|1|1
Arjun Tendulkar|BOWL|IND|0.25|61|M|lsg|1|0|1
Wanindu Hasaranga|AR|SL|1.0|82|S|lsg|0|1|1
Gudakesh Motie|BOWL|WI|0.25|60|S|lsg|0|0|1
Naman Tiwari|BOWL|IND|0.25|60|M|lsg|0|0|1
Ravichandran Ashwin|AR|IND|1.5|84||||1|0
Harshit Rana|BOWL|IND|0.75|77|F|||1|0
Ben Stokes|AR|ENG|2.0|86||||1|0
Sam Curran|AR|ENG|1.5|82||||1|0
Harry Brook|BAT|ENG|1.5|84||||1|0
Jonny Bairstow|WK|ENG|1.0|80||||1|0
Moeen Ali|AR|ENG|1.0|78||||1|0
Glenn Maxwell|AR|AUS|1.5|85||||1|0
David Warner|BAT|AUS|1.5|84||||1|0
Jake Fraser-McGurk|BAT|AUS|1.0|80||||1|0
Mujeeb Ur Rahman|BOWL|AFG|0.75|76|S|||1|0
Kane Williamson|BAT|NZ|1.5|82||||1|0
Daryl Mitchell|AR|NZ|1.0|80||||1|0
Andre Russell|AR|WI|1.5|86||||1|0
Maheesh Theekshana|BOWL|SL|0.75|77|S|||1|0
Faf du Plessis|BAT|SA|1.0|80||||1|0
Jason Roy|BAT|ENG|0.75|75||||1|0
KS Bharat|WK|IND|0.5|71||||1|0
Deepak Hooda|AR|IND|0.5|72||||1|0
Adam Zampa|BOWL|AUS|0.75|77|S|||1|0
Alzarri Joseph|BOWL|WI|0.5|74|F|||1|0
Steve Smith|BAT|AUS|0.75|78||||0|0
Rassie van der Dussen|BAT|SA|0.75|76||||0|0
Devon Conway|BAT|NZ|1.0|79||||0|0
Mark Chapman|BAT|NZ|0.5|72||||0|0
Ibrahim Zadran|BAT|AFG|0.5|71||||0|0
Alex Carey|WK|AUS|0.75|74||||0|0
Kusal Mendis|WK|SL|0.5|73||||0|0
Rahmanullah Gurbaz|WK|AFG|0.75|76||||0|0
Wriddhiman Saha|WK|IND|0.5|68||||0|0
Vijay Shankar|AR|IND|0.5|70||||0|0
Mahipal Lomror|AR|IND|0.5|69||||0|0
Aaron Hardie|AR|AUS|0.5|72||||0|0
Tom Curran|AR|ENG|0.5|72||||0|0
Mohammad Nabi|AR|AFG|0.5|74||||0|0
Sikandar Raza|AR|ZIM|0.75|76||||0|0
Akash Deep|BOWL|IND|0.75|77|M|||0|0
Mohit Sharma|BOWL|IND|0.5|74|M|||0|0
Piyush Chawla|BOWL|IND|0.5|68|S|||0|0
Mark Wood|BOWL|ENG|1.0|80|F|||0|0
Adil Rashid|BOWL|ENG|0.75|77|S|||0|0
Gus Atkinson|BOWL|ENG|0.75|76|F|||0|0
Josh Tongue|BOWL|ENG|0.5|74|F|||0|0
Reece Topley|BOWL|ENG|0.5|73|M|||0|0
Gerald Coetzee|BOWL|SA|0.75|77|F|||0|0
Keshav Maharaj|BOWL|SA|0.5|72|S|||0|0
Nathan Ellis|BOWL|AUS|0.75|77|M|||0|0
Jhye Richardson|BOWL|AUS|0.5|74|F|||0|0
Tim Southee|BOWL|NZ|0.75|75|M|||0|0
Fazalhaq Farooqi|BOWL|AFG|0.75|76|M|||0|0
Naveen-ul-Haq|BOWL|AFG|0.5|74|M|||0|0`;
const P = DATA.split('\n').map(l => { const a = l.split('|');
  return { n:a[0], r:a[1], c:a[2], b:+a[3], q:+a[4], bt:a[5]||'', t:a[6]||'', m:a[7]===''?null:+a[7], k:+a[8], s:+a[9] }; });


/* ---------- state (in memory) ---------- */
const rooms = new Map();
const r2 = x => Math.round(x * 100) / 100;
const uid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12);

function broadcast(s) {
  s.touched = Date.now();
  for (const c of s.clients) {
    try { c.res.write('data: ' + JSON.stringify(view(s, c.pid)) + '\n\n'); } catch (e) { s.clients.delete(c); }
  }
}

/* ---------- request handling ---------- */
function handle(r) {
  const a = r.a;
  if (a === 'create' || a === 'join') return enter(r);
  const code = String(r.code || '').toUpperCase().trim();
  const s = rooms.get(code);
  if (!s) throw new Error('Room not found or expired.');
  if (!s.players[r.pid]) throw new Error('Session expired. Please rejoin.');
  const moved = tick(s);
  try { act(s, r); }
  catch (e) { if (moved) broadcast(s); throw e; }
  syncPause(s, Date.now());
  s.seq++; broadcast(s);
  return view(s, r.pid);
}

function enter(r) {
  const name = String(r.name || '').trim().slice(0, 20);
  if (!name) throw new Error('Enter your name first.');
  if (r.a === 'create') {
    let code; do { code = Array.from({length:4}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random()*24)]).join(''); } while (rooms.has(code));
    const pid = uid();
    const s = { code, host: pid, phase: 'lobby', pool: 'sq26', maxsq: DEFSQ, players: {}, seq: 1, log: [], clients: new Set(), touched: Date.now() };
    s.players[pid] = { name, team: null };
    rooms.set(code, s); return view(s, pid);
  }
  const code = String(r.code || '').toUpperCase().trim();
  const s = rooms.get(code);
  if (!s) throw new Error('Room not found or expired.');
  let pid = r.pid;
  if (!(pid && s.players[pid])) {
    if (Object.keys(s.players).length >= 20) throw new Error('Room is full.');
    pid = uid();
    s.players[pid] = { name, team: null };       // joins as spectator after start
    s.seq++; broadcast(s);
  }
  return view(s, pid);
}

/* ---------- actions ---------- */
function act(s, r) {
  const pl = s.players[r.pid], isHost = r.pid === s.host, now = Date.now();
  if (s.trades) s.trades = s.trades.filter(t => now < t.at + TRADE_TTL);
  if (s.pausedAt && ['bid', 'pass', 'sell', 'skipset'].includes(r.a)) throw new Error('Auction is paused while a trade offer is open.');
  switch (r.a) {
    case 'claim': {
      if (s.phase !== 'lobby') throw new Error('Auction already started.');
      if (!TEAM_IDS.includes(r.team)) throw new Error('Unknown team.');
      if (Object.values(s.players).some(p => p.team === r.team && p !== pl)) throw new Error('That team is taken.');
      pl.team = r.team; break; }
    case 'unclaim': if (s.phase === 'lobby') pl.team = null; break;
    case 'opt':
      if (!isHost || s.phase !== 'lobby') throw new Error('Only the host can change this.');
      if (['sq26','all','core'].includes(r.pool)) s.pool = r.pool;
      if (SQ_OPTS.includes(Number(r.sq))) s.maxsq = Number(r.sq);
      break;
    case 'start': startAuction(s, isHost, now); break;
    case 'bid': placeBid(s, r, now); break;
    case 'pass': {
      const tid = pl.team;
      if (s.phase !== 'auction' || s.stage !== 'bid' || !s.tm[tid]) throw new Error('You cannot pass now.');
      if (s.lead === tid || s.passed.includes(tid)) break;
      s.passed.push(tid); s.log.push(s.tm[tid].s + ' pass'); earlyClose(s, now); break; }
    case 'sell':
      if (!isHost || s.stage !== 'bid') throw new Error('Host only.');
      s.endsAt = now; tick(s); break;
    case 'skipset':
      if (!isHost || s.stage !== 'bid') throw new Error('Host only.');
      s.skipSet = s.setOf[s.cur]; s.endsAt = now; tick(s); break;
    case 'tpropose': proposeTrade(s, pl, r, now); break;
    case 'taccept': case 'tdecline': case 'tcancel': answerTrade(s, pl, r, now); break;
    case 'end':
      if (!isHost || s.phase !== 'auction') throw new Error('Host only.');
      finish(s); break;
    default: throw new Error('Unknown action.');
  }
}

/* ---------- trades (player(s) and/or purse between two teams) ---------- */
const osOf = list => list.filter(i => P[i].c !== 'IND').length;
function cash(x) {
  const v = Math.round(Number(x || 0) * 100) / 100;
  if (!isFinite(v) || v < 0 || v > 100) throw new Error('Purse amount must be between 0 and 100 Cr.');
  return v;
}
function ids(a) {
  const out = []; (Array.isArray(a) ? a : []).forEach(x => { const n = Number(x); if (Number.isInteger(n) && n >= 0 && n < P.length && out.indexOf(n) < 0) out.push(n); });
  if (out.length > 2) throw new Error('Max 2 players per side.');
  return out;
}
/* '' when the trade can go ahead right now, otherwise the reason */
function tradeWhy(s, t, now) {
  const A = s.tm && s.tm[t.from], B = s.tm && s.tm[t.to];
  if (!A || !B) return 'Both teams must be in the auction.';
  if (now >= t.at + TRADE_TTL) return 'Offer expired.';
  const ha = A.sq.map(x => x[0]), hb = B.sq.map(x => x[0]);
  if (!t.gp.every(i => ha.indexOf(i) >= 0)) return 'A player offered is no longer in ' + t.from.toUpperCase() + ' squad.';
  if (!t.rp.every(i => hb.indexOf(i) >= 0)) return 'A player asked for is no longer in ' + t.to.toUpperCase() + ' squad.';
  const net = r2(t.gc - t.rc);                         // >0: proposer pays
  if (A.purse - net < -1e-9) return t.from.toUpperCase() + ' does not have enough purse.';
  if (B.purse + net < -1e-9) return t.to.toUpperCase() + ' does not have enough purse.';
  const aSq = ha.length - t.gp.length + t.rp.length, bSq = hb.length - t.rp.length + t.gp.length;
  if (aSq > msq(s)) return t.from.toUpperCase() + ' squad would exceed ' + msq(s) + '.';
  if (bSq > msq(s)) return t.to.toUpperCase() + ' squad would exceed ' + msq(s) + '.';
  if (osOf(ha.filter(i => t.gp.indexOf(i) < 0).concat(t.rp)) > OSL) return t.from.toUpperCase() + ' would have too many overseas players.';
  if (osOf(hb.filter(i => t.rp.indexOf(i) < 0).concat(t.gp)) > OSL) return t.to.toUpperCase() + ' would have too many overseas players.';
  if (s.stage === 'bid' && s.lead && (s.lead === t.from || s.lead === t.to)) {   // the leader must still be able to pay for the lot
    const isA = s.lead === t.from, T = isA ? A : B, left = isA ? ha.filter(i => t.gp.indexOf(i) < 0).concat(t.rp) : hb.filter(i => t.rp.indexOf(i) < 0).concat(t.gp);
    const purse = isA ? A.purse - net : B.purse + net, nm = s.lead.toUpperCase();
    if (purse < s.bid - 1e-9) return nm + ' is leading the bid and needs ' + s.bid + ' Cr purse to cover it.';
    if (left.length >= msq(s)) return nm + ' needs a free squad slot for the player it is bidding on.';
    if (P[s.cur].c !== 'IND' && osOf(left) >= OSL) return nm + ' needs an overseas slot for the player it is bidding on.';
  }
  return '';
}
function proposeTrade(s, pl, r, now) {
  if (s.phase !== 'auction') throw new Error('Trades open once the auction starts.');
  const from = pl.team, to = String(r.to || '');
  if (!from || !s.tm[from]) throw new Error('Only team owners can trade.');
  if (!s.tm[to] || to === from) throw new Error('Choose another team in the auction.');
  const t = { id: (s.tn = (s.tn || 0) + 1), from, to, gp: ids(r.gp), gc: cash(r.gc), rp: ids(r.rp), rc: cash(r.rc), at: now };
  if (t.gc > 0 && t.rc > 0) throw new Error('Use one purse amount: either you add or you ask.');
  if (!t.gp.length && !t.rp.length) throw new Error('Include at least one player.');
  const w = tradeWhy(s, t, now); if (w) throw new Error(w);
  s.trades = s.trades || [];
  if (s.trades.filter(x => x.from === from).length >= 3) throw new Error('You already have 3 open offers. Cancel one first.');
  s.trades.push(t);
  s.log.push(from.toUpperCase() + ' offered a trade to ' + to.toUpperCase());
}
function answerTrade(s, pl, r, now) {
  const t = (s.trades || []).find(x => x.id === Number(r.id));
  if (!t) throw new Error('That offer is gone.');
  const me = pl.team;
  if (r.a === 'tcancel') { if (me !== t.from) throw new Error('Not your offer.'); s.trades = s.trades.filter(x => x !== t); return; }
  if (me !== t.to) throw new Error('This offer is not for your team.');
  if (r.a === 'tdecline') { s.trades = s.trades.filter(x => x !== t); s.log.push(t.to.toUpperCase() + ' declined a trade from ' + t.from.toUpperCase()); return; }
  const w = tradeWhy(s, t, now);
  if (w) { if (/expired|no longer/.test(w)) s.trades = s.trades.filter(x => x !== t); throw new Error(w); }
  const A = s.tm[t.from], B = s.tm[t.to], net = r2(t.gc - t.rc);
  const take = (tm, list) => { const out = []; tm.sq = tm.sq.filter(x => { if (list.indexOf(x[0]) >= 0) { out.push(x); return false; } return true; }); return out; };
  const fromA = take(A, t.gp), fromB = take(B, t.rp);   // price paid at auction travels with the player
  fromB.forEach(x => A.sq.push(x)); fromA.forEach(x => B.sq.push(x));
  A.os = osOf(A.sq.map(x => x[0])); B.os = osOf(B.sq.map(x => x[0]));
  A.purse = r2(A.purse - net); B.purse = r2(B.purse + net);
  s.trades = s.trades.filter(x => x !== t && tradeWhy(s, x, now) === '');   // drop offers this trade made impossible
  const nm = l => l.map(i => P[i].n).join(' & ');
  s.log.push('TRADE: ' + t.from.toUpperCase() + ' gives ' + (nm(t.gp) || 'no players') + (t.gc ? ' + ' + t.gc + ' Cr' : '') + ' to ' + t.to.toUpperCase() + ' for ' + (nm(t.rp) || 'no players') + (t.rc ? ' + ' + t.rc + ' Cr' : ''));
  if (s.log.length > 40) s.log = s.log.slice(-30);
}

const poolIdx = m => P.map((p, i) => i).filter(i => m === 'sq26' ? P[i].s : m === 'core' ? P[i].k : true);

function buildSets(pool) {
  const setOf = {}, names = ['Set 1 - Marquee stars (top 10)'];
  pool.slice().sort((a, b) => P[b].q - P[a].q).slice(0, 10).forEach(i => setOf[i] = 0);
  let k = 1;
  [['BAT','Batters'],['AR','All-rounders'],['WK','Wicketkeepers'],['BOWL','Spin bowlers','S'],['BOWL','Mid-fast bowlers','M'],['BOWL','Fast bowlers','F']].forEach(([r, l, t]) => {
    const a = pool.filter(i => setOf[i] === undefined && P[i].r === r && (!t || (P[i].bt || 'M') === t)).sort((x, y) => P[y].q - P[x].q);
    for (let j = 0; j < a.length; j += 10) { a.slice(j, j + 10).forEach(i => setOf[i] = k); names.push('Set ' + (k + 1) + ' - ' + l + (a.length > 10 ? ' ' + (j / 10 + 1) : '')); k++; }
  });
  return { setOf, names };
}

function startAuction(s, isHost, now) {
  if (!isHost) throw new Error('Only the host can start.');
  if (s.phase !== 'lobby') throw new Error('Already started.');
  const claimed = Object.entries(s.players).filter(([k, p]) => p.team);
  if (claimed.length < 2) throw new Error('At least 2 teams must be picked.');
  const pool = poolIdx(s.pool);
  if (pool.length < claimed.length * 15) throw new Error('Pool has only ' + pool.length + ' players: too few for ' + claimed.length + ' teams.');
  const bs = buildSets(pool); s.setOf = bs.setOf; s.setn = bs.names;
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  s.order = pool.sort((x, y) => s.setOf[x] - s.setOf[y]);
  s.tm = {}; claimed.forEach(([k, p]) => s.tm[p.team] = { s: p.team.toUpperCase(), owner: p.name, purse: PURSE, os: 0, sq: [] });
  s.i = -1; s.un = []; s.passed = []; s.phase = 'auction';
  s.log = ['Auction started!'];
  nextLot(s, now);
}

/* ---------- auction engine ---------- */
const inc = b => b < 2 ? .25 : b < 5 ? .5 : 1;
const nextBid = s => s.lead ? r2(s.bid + inc(s.bid)) : P[s.cur].b;

function why(s, tid, amt) {
  const t = s.tm[tid], p = P[s.cur];
  if (!t) return 'No team';
  if (s.passed.includes(tid)) return 'Passed';
  if (t.sq.length >= msq(s)) return 'Squad full';
  if (p.c !== 'IND' && t.os >= OSL) return 'Overseas full';
  if (t.purse - amt < Math.max(0, Math.min(14, msq(s)) - t.sq.length) * .5) return 'Purse low';
  return '';
}

function placeBid(s, r, now) {
  const tid = s.players[r.pid].team;
  if (s.phase !== 'auction' || !s.tm[tid]) throw new Error('Pick a team in the lobby to bid.');
  if (s.stage !== 'bid' || now >= s.endsAt) throw new Error('Bidding is closed for this lot.');
  if (s.lead === tid) throw new Error('You already lead.');
  const need = nextBid(s);
  if (Math.abs(need - r.amt) > 1e-9) throw new Error('Price moved to ' + need + ' Cr.');
  const w = why(s, tid, need); if (w) throw new Error(w);
  s.bid = need; s.lead = tid;
  s.endsAt = Math.max(s.endsAt, now + BUMP_MS);
  s.log.push(tid.toUpperCase() + ' bids ' + need + ' Cr');
  if (s.log.length > 40) s.log = s.log.slice(-30);
  earlyClose(s, now);
}

function earlyClose(s, now) {
  const any = Object.keys(s.tm).some(t => t !== s.lead && !why(s, t, nextBid(s)));
  if (!any) s.endsAt = Math.min(s.endsAt, now + (s.lead ? 1500 : 500));
}

/* a trade offer that is open freezes the lot clock; when the last one closes the clock resumes where it stopped */
function syncPause(s, now) {
  if (s.phase !== 'auction') return false;
  const open = s.trades && s.trades.length > 0;
  if (open && !s.pausedAt) { s.pausedAt = now; return true; }
  if (!open && s.pausedAt) {
    const d = now - s.pausedAt;
    if (s.endsAt) s.endsAt += d;
    if (s.resUntil) s.resUntil += d;
    s.pausedAt = 0; return true;
  }
  return false;
}

const due = s => {
  const n = Date.now();
  if (s.phase !== 'auction') return false;
  if (s.pausedAt) return !(s.trades || []).some(t => n < t.at + TRADE_TTL);   // all offers expired: resume
  return (s.stage === 'bid' && n >= s.endsAt) || (s.stage === 'res' && n >= s.resUntil);
};

function tick(s) {
  if (s.phase !== 'auction') return false;
  let ch = false;
  const n0 = Date.now();
  if (s.trades && s.trades.length) { const k = s.trades.filter(t => n0 < t.at + TRADE_TTL); if (k.length !== s.trades.length) { s.trades = k; ch = true; } }
  if (syncPause(s, n0)) ch = true;
  if (!s.pausedAt) {
    for (let g = 0; g < 500; g++) {
      const now = Date.now();
      if (s.stage === 'bid' && now >= s.endsAt) { settle(s, now); ch = true; }
      else if (s.stage === 'res' && now >= s.resUntil && s.phase === 'auction') { nextLot(s, now); ch = true; }
      else break;
    }
  }
  if (ch) s.seq++;
  return ch;
}

function settle(s, now) {
  const p = P[s.cur]; let sold = false;
  if (s.lead) {
    const t = s.tm[s.lead];
    if (t.sq.length < msq(s) && !(p.c !== 'IND' && t.os >= OSL) && t.purse >= s.bid) {
      t.purse = r2(t.purse - s.bid); t.sq.push([s.cur, s.bid]); if (p.c !== 'IND') t.os++;
      sold = true; s.res = { k: 'sold', i: s.cur, t: s.lead, a: s.bid };
      s.log.push('SOLD! ' + p.n + ' to ' + s.lead.toUpperCase() + ' for ' + s.bid + ' Cr');
    }
  }
  if (!sold) { s.un.push(s.cur); s.res = { k: 'unsold', i: s.cur }; s.log.push('Unsold: ' + p.n); }
  s.stage = 'res'; s.resUntil = now + RES_MS;
}

function nextLot(s, now) {
  s.i++;
  for (;; s.i++) {
    if (s.i >= s.order.length || Object.keys(s.tm).every(t => s.tm[t].sq.length >= msq(s))) return finish(s);
    const idx = s.order[s.i];
    if (s.skipSet != null) { if (s.setOf[idx] === s.skipSet) { s.un.push(idx); continue; } s.skipSet = null; }
    s.cur = idx;
    if (!Object.keys(s.tm).some(t => { s.passed = []; return !why(s, t, P[idx].b); })) { s.un.push(idx); continue; }
    break;
  }
  s.stage = 'bid'; s.bid = 0; s.lead = null; s.passed = []; s.res = null; s.endsAt = now + BID_MS;
  s.log.push('Next up: ' + P[s.cur].n + ' (' + P[s.cur].r + ', ' + P[s.cur].c + '), base ' + P[s.cur].b + ' Cr');
}

function finish(s) { s.phase = 'done'; s.stage = 'done'; s.log.push('Auction complete!'); }

/* ---------- what each device sees (no player ids are ever sent) ---------- */
function view(s, pid) {
  const me = s.players[pid];
  return {
    ok: 1, now: Date.now(), seq: s.seq, maxsq: msq(s), bidMs: BID_MS, bumpMs: BUMP_MS, paused: s.phase === 'auction' && !!s.pausedAt, pausedAt: s.pausedAt || 0, pend: (s.trades || []).slice(0, 1).map(t => [t.from, t.to])[0] || null, code: s.code, phase: s.phase, stage: s.stage || null, pool: s.pool,
    you: { pid, team: me.team, isHost: pid === s.host },
    players: Object.entries(s.players).map(([k, p]) => ({ name: p.name, team: p.team, host: k === s.host })),
    teams: s.tm ? Object.entries(s.tm).map(([id, t]) => ({ id, owner: t.owner, purse: t.purse, os: t.os, sq: t.sq })) : [],
    cur: s.cur, i: s.i, total: s.order ? s.order.length : 0, setLabel: s.setn && s.cur != null ? s.setn[s.setOf[s.cur]] : '',
    bid: s.bid, lead: s.lead, endsAt: s.endsAt, passed: s.passed || [], res: s.res || null, un: s.un || [],
    log: (s.log || []).slice(-8),
    trades: (s.trades || []).filter(t => me.team && (t.from === me.team || t.to === me.team) && Date.now() < t.at + TRADE_TTL).map(t => ({ id: t.id, from: t.from, to: t.to, gp: t.gp, gc: t.gc, rp: t.rp, rc: t.rc, exp: t.at + TRADE_TTL }))
  };
}

/* ---------- clock: settles lots and resumes after trades, pushes to everyone ---------- */
setInterval(() => {
  for (const s of rooms.values()) if (s.phase === 'auction' && due(s) && tick(s)) broadcast(s);
}, 100);
setInterval(() => {                                   // forget rooms nobody has touched for 6 hours
  const old = Date.now() - 6 * 3600 * 1000;
  for (const [k, s] of rooms) if (s.clients.size === 0 && s.touched < old) rooms.delete(k);
}, 600000);
setInterval(() => { for (const s of rooms.values()) for (const c of s.clients) { try { c.res.write(': ping\n\n'); } catch (e) { s.clients.delete(c); } } }, 15000);

/* ---------- http ---------- */
const INDEX = fs.readFileSync(path.join(__dirname, 'index.html'));
const send = (res, code, body, type) => { res.writeHead(code, { 'Content-Type': type || 'application/json', 'Cache-Control': 'no-store' }); res.end(body); };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) return send(res, 200, INDEX, 'text/html; charset=utf-8');
  if (url.pathname === '/healthz') return send(res, 200, 'ok', 'text/plain');
  if (req.method === 'GET' && url.pathname === '/meta') return send(res, 200, JSON.stringify({ P }));

  if (req.method === 'GET' && url.pathname === '/events') {
    const s = rooms.get(String(url.searchParams.get('code') || '').toUpperCase());
    const pid = url.searchParams.get('pid');
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    if (!s || !s.players[pid]) { res.write('data: ' + JSON.stringify({ err: 'Room not found or expired.' }) + '\n\n'); return res.end(); }
    const client = { pid, res }; s.clients.add(client);
    res.write('retry: 1000\n\n');
    res.write('data: ' + JSON.stringify(view(s, pid)) + '\n\n');
    req.on('close', () => s.clients.delete(client));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api') {
    let body = '';
    req.on('data', d => { body += d; if (body.length > 20000) req.destroy(); });
    req.on('end', () => {
      try { send(res, 200, JSON.stringify(handle(JSON.parse(body || '{}')))); }
      catch (e) { send(res, 200, JSON.stringify({ err: String(e && e.message || e) })); }
    });
    return;
  }
  send(res, 404, 'Not found', 'text/plain');
}).listen(process.env.PORT || 3000, '0.0.0.0', () => console.log('IPL auction running on port ' + (process.env.PORT || 3000)));
