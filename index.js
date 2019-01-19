// REQUIRED MODULES
const fs = require('fs');
const csv = require('csvtojson');

// RUNNING SCRIPT
main();

// ======================================================
// GENERATING TEXT - MAIN FUNCTION
// ======================================================
function parseData() {
	// string to hold the entirety of what will be written to the
	// final text file
	let reportCardText = '';
	for (let n = 0; n < studentInfo.length; n++) {
		reportCardText += formatStudentInfo(studentInfo[n]);
		reportCardText += findOverallAverage(studentInfo[n].id, markInfo);
	}
	fs.writeFile('.reportcards.txt', reportCardText, function(err) {
		if (err) {
			return console.log(err);
		}
		console.log('ding ding report cards fresh out of the oven!');
	});
}

// ======================================================
//  GENERATING TEXT - HELPERS
// ======================================================

// STUDENT INFO FROM STUDENTS.CSV (first line)
function formatStudentInfo(student) {
	return `Student Id: ${student.id}, name: ${student.name}\n`;
}

// FIND OVERALL AVERAGE
function findOverallAverage(studentId, marksArray) {
	let studentMarks = [];
	for (let i = 0; i < marksArray.length; i++) {
		// filter all marks to relevant student

		if (marksArray[i].student_id === String(studentId)) {
			studentMarks.push(marksArray[i]);
		}
	}
	let finalScores = [];
	for (let j = 0; j < courseInfo.length; j++) {
		if (courseInfo[j].studentList.includes(studentId)) {
			let courseName = courseInfo[j].name;
			let courseTeacher = courseInfo[j].teacher;
			let courseAverage = findCourseAverage(
				studentMarks,
				courseInfo[j].id,
				testInfo
			);
			finalScores.push({
				course: courseName,
				average: courseAverage,
				teacher: courseTeacher
			});
		}
	}

	let totalScore = 0;
	// find average overall
	for (let i = 0; i < finalScores.length; i++) {
		totalScore += Number(finalScores[i].average);
	}

	// find average marks in each course
	let finalStrings = `Total Average: ${(
		totalScore / finalScores.length
	).toFixed(2)}% \n\n`;
	for (let i = 0; i < finalScores.length; i++) {
		if (i === finalScores.length - 1) {
			finalStrings += `    Course: ${finalScores[i].course}, Teacher: ${
				finalScores[i].teacher
			} \n    Final Grade: ${finalScores[i].average}%\n\n\n`;
		} else {
			finalStrings += `    Course: ${finalScores[i].course}, Teacher: ${
				finalScores[i].teacher
			} \n    Final Grade: ${finalScores[i].average}%\n\n`;
		}
	}
	//  return mark section of report card
	return finalStrings;
}

// CHECK WHICH TEST IDS CORRESPOND TO WHICH COURSE
function mapTotalTestsToCourse(testArr) {
	let courses = [];
	for (let i = 0; i < courseInfo.length; i++) {
		let testIdsInCourse = [];
		for (let j = 0; j < testArr.length; j++) {
			if (courseInfo[i].id === testArr[j].course_id) {
				testIdsInCourse.push(testArr[j].id);
			}
		}
		courses.push({
			id: courseInfo[i].id,
			testIdsInCourse: testIdsInCourse
		});
	}

	return courses;
}

// ADD TOTAL NUMBER OF TESTS TO COURSE OBJECT
function addTotalTestColumnToCourses(courseArr, testArr) {
	let newCourseArray = courseArr;
	for (let i = 0; i < courseArr.length; i++) {
		for (let j = 0; j < testArr.length; j++) {
			if (testArr[j].id === courseArr[i].id) {
				newCourseArray[i].testIdsInCourse = testArr[j].testIdsInCourse;
			}
		}
	}
	return newCourseArray;
}

// CHECK IF STUDENT IS IN COURSE
function isEnrolled() {
	let newCourseInfo = courseInfo;
	for (let i = 0; i < courseInfo.length; i++) {
		let studentList = [];
		for (let j = 0; j < markInfo.length; j++) {
			if (courseInfo[i].testIdsInCourse.includes(markInfo[j].test_id)) {
				if (!studentList.includes(markInfo[j].student_id))
					studentList.push(markInfo[j].student_id);
			}
		}
		newCourseInfo[i].studentList = studentList;
	}
	return newCourseInfo;
}

// FINDING INDIVIDUAL WEIGHTED MARK
// ROUNDS TO 2 DECIMAL PLACES
function findCourseAverage(studentMarksArray, courseId, testArr) {
	// compare student marks array to test array
	let totalMarks = 0;
	for (let i = 0; i < studentMarksArray.length; i++) {
		for (let j = 0; j < testArr.length; j++) {
			if (
				studentMarksArray[i].test_id == testArr[j].id &&
				testArr[j].course_id == courseId
			) {
				totalMarks +=
					(Number(testArr[j].weight) / 100) *
					Number(studentMarksArray[i].mark);
			}
		}
	}
	return totalMarks.toFixed(2);
}

// ======================================================
// TESTING:
// CHECK IF WEIGHTS IN TEST.CSV SUM TO 100
function sumWeights(testArr) {
	// sort tests by courses
	let courseIdArray = [];
	for (let i = 0; i < courseInfo.length; i++) {
		courseIdArray.push(courseInfo[i].id);
	}
	// loop thru total number of courses and check
	// to make sure all test weights sum up to 100
	for (let i = 0; i < courseIdArray.length; i++) {
		let runningSum = 0;
		for (let j = 0; j < testInfo.length; j++) {
			if (testInfo[j].course_id == courseIdArray[i]) {
				runningSum += Number(testInfo[j].weight);
			}
		}
		if (runningSum !== 100) {
			console.log(
				`Warning - the weighting for ${courseInfo[i].name} (course id ${
					courseInfo[i].id
				}) does not sum to 100!`
			);
		}
	}
}
// ======================================================
// READING
// ======================================================
// BEGIN READING CSV FILES AND WRITING TO MEMORY
function main() {
	csv()
		.fromFile('./backend-assessment/courses.csv')
		.then((jsonObj) => {
			courseInfo.push(...jsonObj);
		})
		.then(() => {
			csv()
				.fromFile('./backend-assessment/marks.csv')
				.then((jsonObj) => {
					markInfo.push(...jsonObj);
					csv()
						.fromFile('./backend-assessment/students.csv')
						.then((jsonObj) => {
							studentInfo.push(...jsonObj);
							csv()
								.fromFile('./backend-assessment/tests.csv')
								.then((jsonObj) => {
									testInfo.push(...jsonObj);
									let totalTests = mapTotalTestsToCourse(jsonObj);
									courseInfo = isEnrolled(
										addTotalTestColumnToCourses(
											courseInfo,
											totalTests
										)
									);
									sumWeights(testInfo);
									parseData();
								});
						});
				});
		});
}

// INITIALIZE GLOBALS TO HOLD CSV DATA
let courseInfo = [];
let markInfo = [];
let studentInfo = [];
let testInfo = [];
