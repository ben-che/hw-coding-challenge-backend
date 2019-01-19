# To run:
1. Navigate to the root directly in your terminal
2. Ensure that your machine has node and npm installed - this project uses
a number of npm packages
3. Ensure that all the csv files are in the `backend-assessment` folder - 
if there is a file missing, the script will throw an error
4. In the root directory type `npm install` in your terminal
5. To write the file, type `node index.js` in your terminal - you should see
a success message and a new file called `reportcards.txt`

### Some nice to knows
- Instead of throwing errors and stopping the code when a course's weight does not
sum to 100%, I just console log a warning
- If a student is not enrolled in a course, that course will not show up on their
report card, as opposed to me throwing an error
- The output file is generated in the root directory of the project, as
reportcards.txt
- Let me know if you have any questions / problems, I can be contacted through:
    - Github: ben-che
    - website: ben-che.com
    - email: ben.che9@gmail.com
- Thanks for you time!