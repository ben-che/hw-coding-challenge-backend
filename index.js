var path = require('path');
var fs = require('fs');
const csv = require('csvtojson');

// finding files
const fileArray = [];

// saving content in memory
let courseInfo = [];
let markInfo = [];
let studentInfo = [];
let testInfo = [];

fromDir('./backend-assessment', '.csv');

// Reading data:

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
									addTotalTestColumnToCourses(courseInfo, totalTests)
								);
								parseData();
							});
					});
			});
	});

// main function
function parseData() {
	// console.log(courseInfo);
	// console.log(markInfo);
	// console.log(studentInfo);
	// console.log(testInfo);

	let reportCardArray = [];
	for (let n = 0; n < studentInfo.length; n++) {
		console.log(formatStudentInfo(studentInfo[n]));
		console.log(findOverallAverage(studentInfo[n].id, markInfo));
		// console.log(marks);
	}
}

// returns path of all csv files in dir
function fromDir(startPath, fileType) {
	if (!fs.existsSync(startPath)) {
		console.log('no dir ', startPath);
		return;
	}

	var files = fs.readdirSync(startPath);
	for (var i = 0; i < files.length; i++) {
		var fileName = path.join(startPath, files[i]);
		var stat = fs.lstatSync(fileName);
		if (stat.isDirectory()) {
			fromDir(fileName, fileType); //recurse
		} else if (fileName.indexOf(fileType) >= 0) {
			fileArray.push(fileName);
		}
	}
}

// STUDENT INFO FROM STUDENTS.CSV (first line)
function formatStudentInfo(student) {
	return `Student Id: ${student.id}, name: ${student.name}`;
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
