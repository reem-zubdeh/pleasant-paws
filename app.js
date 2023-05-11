const express = require('express');
const multer = require('multer');
const validator = require('validator');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs');

require('dotenv').config();

const connectionURL = "mongodb://127.0.0.1/PleasantPawsDB";

const app = express();

function authenticate(cookies) {
    if (cookies && cookies.authToken) {
        const token = cookies.authToken;
        try {
            const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            return user;
        } catch (err) {
            return false;
        }
    } else {
        return false;
    }
}

app.set('view engine', 'ejs');
app.use(express.static('assets'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

let db;

MongoClient.connect(connectionURL, (err, database) => {
    if (err) throw err;
    db = database.db("PleasantPawsDB");
    const server = app.listen(3000, () => {
        console.log("server is running");
    });
});


app.get('/', (req, res) => {
    res.render('index', {user: authenticate(req.cookies)});
});

app.get('/dogs', (req, res) => {
    db.collection("Pets").find({species: "Dog"}).toArray( (err, results) => {
        if (err) throw err;
        res.render('dogs', { user: authenticate(req.cookies), dogs: results });
    });
});

app.get('/cats', (req, res) => {
    db.collection("Pets").find({species: "Cat"}).toArray( (err, results) => {
        if (err) throw err;
        res.render('cats', { user: authenticate(req.cookies), cats: results });
    });
});

app.get('/signup', (req, res) => {
    if (authenticate(req.cookies)) res.redirect('/');
    else res.render('signup', {missing: false, email: false, phone: false, pass: false, passmatch: false});
});

app.get('/login', (req, res) => {
    if (authenticate(req.cookies)) res.redirect('/');
    else res.render('login', {incorrect : false});
});

app.get('/profile', (req, res) => {
    let user = authenticate(req.cookies);
    if (!user) res.redirect('/login');
    else {

        let name;
        db.collection("Users").findOne({email: user.name}, (err, result) => {
            if (err) throw err;
            if (!result) {
                res.redirect('/logout');
                return;
            }
            name = result.firstname;
            db.collection("Pets").find({owner: user.name}).toArray((err, results) => {
                if (err) throw err;
                res.render('profile', {user, name, pets: results});
            });
        });

    }
});

app.get('/user', (req, res) => {
    let target = req.query.q;
    if (!target) {
        res.redirect('/');
    }
    else {
        db.collection("Users").findOne({email: target}, (err, result) => {
            if (err) throw err;
            if (!result) {
                res.redirect('/');
                return;
            }
            res.render('user', {
                user: authenticate(req.cookies),
                firstname : result.firstname,
                lastname: result.lastname,
                email: result.email,
                phone : result.phone,
                info : result.info ? result.info : ''
            });

        });
    }
});

app.get('/upload', (req, res) => {
    let user = authenticate(req.cookies);
    if (!user) res.redirect('/login');
    else res.render('upload', user);
});

app.get('/edit', (req, res) => {
    let user = authenticate(req.cookies);
    if (!user) res.redirect('/login');
    else {

        db.collection("Users").findOne({email: user.name}, (err, result) => {
            if (err) throw err;
            if (!result) {
                res.redirect('/logout');
                return;
            }                
            res.render('edit', {
                firstname : result.firstname,
                lastname: result.lastname,
                home : result.home,
                phone : result.phone,
                info : result.info
            });

        });

    }
});

app.post('/signup', (req, res) => {

    let firstname, lastname, home, email, phone, password, passwordrepeat, info;

    if (
        !validator.isEmpty(req.body.firstname, {ignore_whitespace : true}) &&
        !validator.isEmpty(req.body.lastname, {ignore_whitespace : true}) &&
        !validator.isEmpty(req.body.home, {ignore_whitespace : true}) &&
        !validator.isEmpty(req.body.email, {ignore_whitespace : true}) &&
        !validator.isEmpty(req.body.phone, {ignore_whitespace : true}) &&
        !validator.isEmpty(req.body.password) &&
        !validator.isEmpty(req.body.passwordrepeat)
    ) {
        firstname = req.body.firstname.trim();
        lastname = req.body.lastname.trim();
        home = req.body.home.trim();
        email = req.body.email.trim();
        phone = req.body.phone.trim();
        password = req.body.password;
        passwordrepeat = req.body.passwordrepeat;
        info = req.body.info.trim();
    } else {
        res.render('signup', {missing: true, email: false, phone: false, pass: false, passmatch: false});
        return;
    }

    if (!validator.isEmail(email)) {
        res.render('signup', { missing: false, email: true, phone: false, pass: false, passmatch: false });
        return;
    }
    if (!validator.isMobilePhone(phone)) {
        res.render('signup', { missing: false, email: false, phone: true, pass: false, passmatch: false });
        return;
    }
    if (!validator.isLength(password, {min: 8, max: 30})) {
        res.render('signup', { missing: false, email: false, phone: false, pass: true, passmatch: false });
        return;
    }
    if (password != passwordrepeat) {
        res.render('signup', { missing: false, email: false, phone: false, pass: false, passmatch: true });
        return;
    }
    
    bcrypt.hash(password, 10, (err, passwordHash) => {
        
        if (err) throw err;

        user = {firstname, lastname, home, email, phone, password: passwordHash};
        if (info != "") user.info = info;

        db.collection("Users").insertOne(user, (err, result) => {
            if (err) throw err;
            res.redirect('/');
        });

    });


});

app.post('/login', (req, res) => {

    let email = req.body.email.trim();
    db.collection("Users").findOne({email}, (err, result) => {
        if (err) throw err;
        if (!result) {
            res.render('login', {incorrect : true});
            return;
        }
        let password = result.password;
        bcrypt.compare(req.body.password, password, (err, matches) => {
            if (!matches) {
                res.render('login', {incorrect : true});
                return;
            }
            //grant access!!
            const user = {name: email};
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
            res.cookie('authToken', accessToken, { maxAge: 30*24*60*60*1000 }); //expires in 30 days
            res.redirect('/');
        });
    });
});

app.get('/logout', (req, res) => {
    res.clearCookie('authToken');
    res.redirect('/');
});

app.post('/upload', (req, res) => {

    let user = authenticate(req.cookies);
    if (!user) res.redirect('/login');
    else {
        
        let image;

        const storageWay = multer.diskStorage({

            destination: (req, file, callback) => {
                callback(null, 'assets/images/pets');
            },

            filename: (req, file, callback) => {    
                let newname = Date.now();
                let splitname = file.originalname.split('.');
                let extension = splitname[splitname.length-1];
                
                let finalname = newname + "." + extension;
                image = finalname;
                callback(null, finalname);
            }

        });

        let upload = multer({ storage: storageWay }).single('image');
        
        upload(req, res, () => {

            let species, name, age, gender, breed, likes, dislikes, owner;

            species = req.body.species.trim();
            name = req.body.name.trim();
            age = req.body.age.trim();
            gender = req.body.gender.trim();
            breed = req.body.breed.trim();
            likes = req.body.likes && req.body.likes.trim();
            dislikes = req.body.dislikes && req.body.dislikes.trim();
            owner = user.name;
            
            let pet = { species, name, age, gender, breed, image, owner };
            if (likes) pet.likes = likes;
            if (dislikes) pet.dislikes = dislikes;

            db.collection("Pets").insertOne(pet, (err, result) => {
                if (err) throw err;
                res.redirect('/');
            });

        });

    }
});

app.post('/edit', (req, res) => {
    let user = authenticate(req.cookies);
    if (!user) res.redirect('/login');
    else {
        let firstname, lastname, home, phone, info;
        firstname = req.body.firstname.trim();
        lastname = req.body.lastname.trim();
        home = req.body.home.trim();
        phone = req.body.phone.trim();
        info = req.body.info.trim();

        let update = { $set: {firstname, lastname, home, phone}};
        if (info != "") update.$set.info = info;
        else {
            db.collection("Users").updateOne({email: user.name}, {$unset: {info: ""}}, (err, result) => {
                if (err) throw err;
            });
        }

        db.collection("Users").updateOne({email: user.name}, update, (err, result) => {
            if (err) throw err;
            res.redirect('/profile');
        });
    }
});

app.post('/delete', (req, res) => {
    let user = authenticate(req.cookies);
    if (!user) res.redirect('/login');
    let idPet = req.body.id;
    
    db.collection("Pets").findOne({_id: ObjectId(idPet)}, (err, result) => {
        if (err) throw err;
        let image = result.image;
        fs.unlink('assets/images/pets/' + image, (err) => {
            if (err) throw err;
        });
    });

    db.collection("Pets").deleteOne({_id: ObjectId(idPet)}, (err, obj) => {
        if (err) throw err;
    });
    
});
