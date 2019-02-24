const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const moment = require('moment')

const gmailEmail = "vladdragonsun@gmail.com";
const gmailPassword = "jhcjhc123";
const mailTransport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword,
    },
    port: 587,
    secure: true
});
const APP_NAME = 'MyPaldip';
const reminderScheduleMinute = 60  // unit is min
admin.initializeApp();

// exports.helloWorld = functions.https.onRequest((request, response) => {
//     response.send("Hello from Firebase!");
// });
let users = [];
// exports.sendTimedEmail = functions.https.onCall((data, context) => {
exports.sendTimedEmail = functions.https.onRequest((req, res) => {
    let currTime = moment()
    let startTime = moment(currTime).subtract(reminderScheduleMinute, 'minutes')

    let records = [
        admin.database().ref(`Groups`).once('value'),
        admin.database().ref(`StudentGroups`).once('value'),
        admin.database().ref(`Users`).once('value'),
        admin.database().ref(`QuestionSets`).once('value'),
        admin.database().ref(`Questions`).once('value'),
        admin.database().ref(`NewAnswers`).once('value'),
        admin.database().ref(`LikertAnswer`).once('value'),
        admin.database().ref(`Settings/reminderSettings`).once('value'),
    ];

    Promise.all(records).then(snapshots => {
        let TeacherGroups = snapshots[0].val();
        let StudentGroups = snapshots[1].val();
        let Users = snapshots[2].val();
        let AllQuestionSets = snapshots[3].val();
        let allQuestions = snapshots[4].val()
        let Questions = {}
        for (questionKey in allQuestions) {
            let question = allQuestions[questionKey]
            let setKey = question.Set
            Questions[setKey] = Questions[setKey] || {}
            Questions[setKey][questionKey] = question
        }
        let Answers = snapshots[5].val();
        let LikertAnswers = snapshots[6].val();
        let reminderSettings = snapshots[7].val();

        let usersInGroup = {}
        let emailList = {}
        let nameList = {}
        for (studentKey in StudentGroups) {
            let stGroups = StudentGroups[studentKey]
            for (key in stGroups) {
                let groupKey = stGroups[key]
                usersInGroup[groupKey] = usersInGroup[groupKey] || []
                usersInGroup[groupKey].push(studentKey)
            }
        }
        for (teacherKey in TeacherGroups) {
            let Groups = TeacherGroups[teacherKey]
            for (groupKey in Groups) {
                let Group = Groups[groupKey]
                let QuestionSets = Group.QuestionSets || {}
                let groupUsers = usersInGroup[groupKey] || []
                for (qsetKey in QuestionSets) {
                    let QuestionSet = QuestionSets[qsetKey]
                    let reminder = QuestionSet.reminder ? QuestionSet.reminder : Group.reminder

                    if (QuestionSet.deadline === undefined || reminder === undefined) continue    // continue if reminder doesn't exist
                    let reminderTime = moment(QuestionSet.deadline).add(reminder.day1, 'days').add(reminder.hour1, 'hours')

                    let pastList = []

                    if (reminderTime.isAfter(startTime) && reminderTime.isBefore(currTime)) {
                        pastList.push({ day: reminder.day1, hour: reminder.hour1 })
                    }
                    if (reminder.count === 2) {
                        reminderTime = moment(QuestionSet.deadline).add(reminder.day2, 'days').add(reminder.hour2, 'hours')
                        if (reminderTime.isAfter(startTime) && reminderTime.isBefore(currTime)) {
                            pastList.push({ day: reminder.day1, hour: reminder.hour1 })
                        }
                    }

                    for (i = 0; i < groupUsers.length; i++) {
                        studentKey = groupUsers[i]
                        let questionSetKey = QuestionSet.siblingSetKey ? QuestionSet.siblingSetKey : qsetKey
                        let qsetQuestions = Questions[questionSetKey] || {}
                        let inComplete = false
                        for (questionKey in qsetQuestions) {
                            if (QuestionSet.LikertType) {
                                if (!LikertAnswers[questionSetKey] || !LikertAnswers[questionSetKey][studentKey] || !LikertAnswers[questionSetKey][studentKey].answer || !LikertAnswers[questionSetKey][studentKey].answer[questionKey]) {
                                    inComplete = true
                                    break
                                }
                            } else {
                                if (!Answers[questionKey] || !Answers[questionKey].answer || !Answers[questionKey].answer[studentKey]) {
                                    inComplete = true
                                    break
                                }
                            }
                        }
                        if (inComplete) {
                            for (pastIndex = 0; pastIndex < pastList.length; pastIndex++) {
                                pastTime = pastList[pastIndex]

                                const teacherEmail = Users[teacherKey].ID
                                const studentEmail = Users[studentKey].ID
                                // const studentEmail = 'vladdragonsun@gmail.com'

                                if (emailList[studentEmail] === undefined) {
                                    emailList[studentEmail] = []
                                    nameList[studentEmail] = Users[studentKey].nick_name ? Users[studentKey].nick_name : 'Student'
                                }
                                emailList[studentEmail].push({
                                    teacherEmail: teacherEmail,
                                    groupName: Group.groupname,
                                    questionSetName: AllQuestionSets[qsetKey].setname,
                                    deadline: QuestionSet.deadline,
                                    pastTime: pastTime,
                                })
                            }
                        }
                    }
                }
            }
        }

        for (studentEmail in emailList) {
            let setList = emailList[studentEmail]
            var items = ""
            for (var i = 0; i < setList.length; i++) {
                items = items + `<div class='list'><p><b>Group Name:</b>${setList[i].groupName}</p><p><b>Questionset Name:</b>${setList[i].questionSetName}</p>` +
                    `<p><b>Past Time:</b> ${pastTime.day} days ${pastTime.hour} hours</p></div>`
            }

            const mailOptions = {
                from: `"${APP_NAME}" <no-reply@mypaldip.com>`,
                to: studentEmail,
                subject: 'Timed Reminder'
            };
            let content = reminderSettings.headerContent
            let regex = new RegExp('<Student>', 'g');
            content = content.replace(regex, nameList[studentEmail]);

            mailOptions.html = `<!doctype html><html><head><meta name="viewport" content="width=device-width" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <title>Timed Reminder</title>
                <style>
                body {background-color: #d8dad9;} .container { background-color: white; width: 80%; margin: 0px auto;border-radius: 6px;padding: 20px;}
                    .header { text-align: center; }   .list { border-bottom: solid 1px #c3c3c3; width: 600px; margin: 0px 0px 20px 40px; }
                    .list>p>b { display: inline-block;  width: 150px; } pre{font-size: 16px;}
                </style></head>    
                <body><div class="container">    
                <h1 class="header">${reminderSettings.title}</h1>
                <div class="content">
                    <pre>${content}</pre>
                    <br />
                    ${items}    
                </div> </div></div> </body></html>`;
            mailTransport.sendMail(mailOptions)
        }
        return res.send(emailList)
    }).catch(error => {
        res.send(error)
    })
});







exports.getUsers = functions.https.onCall((data, context) => {
    users = [];
    return listAllUsers();
});
function listAllUsers(nextPageToken) {
    // List batch of users, 1000 at a time.
    return admin.auth().listUsers(1000, nextPageToken)
        .then((listUsersResult) => {
            listUsersResult.users.forEach((userRecord) => {
                users.push(userRecord);
            });
            if (listUsersResult.pageToken) {
                return listAllUsers(listUsersResult.pageToken)
            } else {
                return users;
            }
        })
        .catch((error) => {
            return ({ error: error });
        });
}
// Start listing users from the beginning, 1000 at a time.


exports.sendEmail = functions.https.onCall((data, context) => {
    // async function sendEmail(adminEmail, teacherEmail) {
    const { adminEmail, teacherEmail, createTime } = data;
    const mailOptions = {
        from: `"${APP_NAME}" <no-reply@mypaldip.com>`,
        to: adminEmail,
    };

    mailOptions.subject = "New teacher added!";
    mailOptions.html = `<h1> Approve Request</h1>
                        <h2>Dear Manager!</h2>
                        <p>New teacher added!<p>
                        <p>Teacher Email:&emsp; <b>${teacherEmail}</b></p>
                        <p>Create Time:&emsp; <b>${createTime}</b></p>
                        <p>Please approve his account.</p>
                        <p>Thanks.</p>`;

    return mailTransport.sendMail(mailOptions).then(() => {
        return { result: 'success' }
    });
});
exports.sendAproveEmail = functions.https.onCall((data, context) => {
    // async function sendEmail(adminEmail, teacherEmail) {
    const { adminEmail, teacherEmail } = data;
    const mailOptions = {
        from: `"${APP_NAME}" <no-reply@mypaldip.com>`,
        to: teacherEmail,
    };

    mailOptions.subject = "Account has been approved!";
    // const title = (state == 'approved') ? "<h1>Account has been approved!</h1>" : "<h1>Account has been disapproved!</h1>";
    // "Your teacher account has now been approved. You can now login using your email and password at www.mypaldip.com and begin creating question sets and groups.
    //  You can access the manual at bit.ly/PaLDIPManual ."

    // mailOptions.html = `<h1>Your teacher account has now been approved!</h1>
    //     <p>You can now login using your email and password at <a href='www.mypaldip.com'>www.mypaldip.com</a> and begin creating question sets and groups.<p>
    //     <p>You can access the manual at <a href='http://bit.ly/PaLDIPManual'>here</a>.</p>
    //     <p>Regards.</p>
    //     <p><b>mypaldip</b> Manager.</p>
    //     `;
    mailOptions.html = `<h1>Your teacher account has now been approved!</h1>
        <p>You can now login using your email and password at www.mypaldip.com and begin creating question sets and groups.<p>
        <p>You can access the manual at http://bit.ly/PaLDIPManual.</p>
        <p>Regards.</p>
        <p><b>mypaldip</b> Manager.</p>
        `;
    return mailTransport.sendMail(mailOptions).then(() => {
        return { result: 'success' }
    });
});

exports.sendReminderEmail = functions.https.onCall((data, context) => {
    const { studentList, emailTemplate } = data;
    studentList.forEach(student => {
        const { email, name } = student
        let emailContent = emailTemplate
        var regex = new RegExp('<Student>', 'g');
        emailContent = emailContent.replace(regex, name);
        mailOptions = {
            from: `"${APP_NAME}" <no-reply@mypaldip.com>`,
            to: email,
        };
        mailOptions.subject = "Answer Request Reminder";
        mailOptions.html = `<h1>Answer Request</h1>
        <pre style="font-size:18px;">`+ emailContent + `</pre>`;
        mailTransport.sendMail(mailOptions)
    });
    return { result: 'success', sendCount: studentList.length }
});