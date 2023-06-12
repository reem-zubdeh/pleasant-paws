# PleasantPaws

Save a stray's life. Put dogs and cats up for adoption or adopt your own pet.

PleasantPaws is a website made to bring a community together to find homes for stray animals.

Made with Node.js and MongoDB. Uses vanilla HTML and CSS on frontend.

# Installation

## 1. Restore MongoDB database locally

Ensure MongoDB is installed. The MongoDB .bson files have been exported with mongodump and placed in /db/PleasantPawsDB. 

Using MongoDB Database Tools: in the root directory, restore the "PleasantPawsDB" database files locally with the mongorestore tool. 

If in project root directory, and mongorestore.exe is present or added to PATH, run this command:

    mongorestore -d PleasantPawsDB db/PleasantPawsDB

See MongoDB Database Tools [download page](https://www.mongodb.com/try/download/database-tools) and [documentation](https://www.mongodb.com/docs/database-tools/) for more help.

## 2. Installing dependencies

Ensure Node.js and npm are installed. Run

    npm install

in project root directory to install dependencies.


## 3. Setting up access token secret

Create an environment variable with an access token secret required for authorization with JWT.

A suggested way to do so is to generate 64 random bytes with Node's built in crypto module. In any terminal, run "node", then run the following command:

    require('crypto').randomBytes(64).toString('hex')

After obtaining your secret, place it into an environment variable as follows: 

1. Create a file named ".env" in project root
2. Paste the environment secret so the contents of the file look like this:

        ACCESS_TOKEN_SECRET=abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234


# Usage

In project root, run

    node app

to start the server. 

Access the website from any browser at localhost:3000.

Sign up with a new account, or log in with one of the dummy accounts included in accounts.txt.
