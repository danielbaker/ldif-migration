var ldif = require("ldif");
var fs = require("fs");
const { Command } = require("commander");

const program = new Command();
program
  .requiredOption("-i, --input <filepath>", "path to ldif file")
  .option("-o, --output <filepath>", "output json file", "import.json")
  .parse(process.argv);

async function readUsers(inputFilepath) {
  (file = ldif.parseFile(inputFilepath)),
    (user = {}),
    (record = {}),
    (users = []);

  while ((record = file.shift())) {
    user = record.toObject();
    if (
      user.attributes &&
      user.attributes.mail &&
      user.attributes.userPassword
    ) {
      users.push(user);
    }
  }

  return users;
}

async function transformUsers(users) {
  return users.map((user) => {
    let { uid, mail, userPassword, ...metadata } = user.attributes;

    return {
      user_id: uid,
      email: mail,
      custom_password_hash: {
        algorithm: "ldap",
        hash: {
          encoding: "utf8",
          value: userPassword,
        },
      },
      app_metadata: metadata,
    };
  });
}

function writeUsers(outputFilepath) {
  return async (users) => {
    fs.writeFileSync(outputFilepath, JSON.stringify(users));
    console.log("done 👍");
  };
}

readUsers(program.input).then(transformUsers).then(writeUsers(program.output));
