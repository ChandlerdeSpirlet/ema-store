const stripe = require('stripe')('sk_test_51H75ScKv0edLDEqJEL6q5HTs0dJN28eeyehpgMBEdEc4BT26iod0kUZpE3zcL0QrwZtwV7kCFTbS7bfb8Ehs6lys00Ut3Az4SN');
const exp_val = require('express-validator');
const express = require('express');
const bodyParser = require('body-parser');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const db =  require('./database');
const session = require('express-session');
var redis = require('redis');
const { json } = require('body-parser');
const { proc } = require('./database');
var client = redis.createClient(process.env.REDIS_URL);
var RedisStore = require('connect-redis')(session);
const app = express();
app.use(express.static(__dirname));
//app.set('views', __dirname + '/');
app.use(exp_val());
const router = express.Router();

app.use(
    session({
        store: new RedisStore({ 
            client: client,
            ttl: 5 * 60
        }),
    secret: process.env.secret_key,
    resave: true,
    saveUninitialized: true
    })
);

app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'html');
app.engine('html', nunjucks.render);
nunjucks.configure('views', {noCache: true});
app.use('/', router);

const YOUR_DOMAIN = 'https://ema-store.herokuapp.com';

router.get('/', function(req, res){
    req.session.key = Math.floor( Math.random() * ( 1 + 10000 - 1 ) ) + 1;
    console.log('session key is ' + req.session.key);
    req.session.order_size = 0;
    if(!req.session.key >= 0){
        req.session.destroy();
        res.redirect('https://ema-store.herokuapp.com/views/shopping_cart.html');
    }
    res.render('shopping_cart.html', function(req, res){

    });
});

router.get('/quantity_cart.html', function(req, res){
    req.session.qty_key = Math.floor( Math.random() * (1 + 10000 - 1)) + 1;
    console.log('sess_qty key is ' + req.session.qty_key);
    req.session.order_qty_size = 0;
    /*
    let qty_query_youth = "select * from inventory where size like '%Youth%';";
    let qty_query_adult = "select * from inventory where size like '%Adult%';";
    db.query(qty_query_youth)
        .then(function(rows){
            db.query(qty_query_adult)
                .then(function(rows_adult){
                    res.render('quantity_cart.html', {
                        youth: rows,
                        adult: rows_adult
                    })
                })
                .catch(function(err){
                    console.log('ERROR: quantity_cart:: ' + err);
                    res.redirect('/');
                })
        })
        .catch(function(err){
            console.log('ERROR: quantity_cart:: ' + err);
            res.redirect('/');
        })
    */
    let qty_towel = "select * from inventory where size = 'Hand Towel';";
    db.query(qty_towel)
        .then(function(rows){
            res.render('quantity_cart.html', {
                towels: rows
            })
        })
        .catch(function(err){
            console.log('ERROR: quantity_cart:: ' + err);
            res.redirect('/');
        })
});
router.post('/process_qty', function(req, res) {//towels
    req.session.order_qty_size = 0;
    var item = {
        order_name: req.sanitize('order_name').trim(),
        order_email: req.sanitize('order_email').trim(),
        red_towel: req.sanitize('red_towel').trim(),
        blue_towel: req.sanitize('blue_towel').trim()
    }
    req.session.qty_order = [];
    req.session.qty_order_name = item.order_name;
    req.session.qty_order_email = item.order_email;
    req.session.qty_desc = '';
    var cost = 0
    if (req.session.qty_order_name == 'Sal Yang'){
        console.log("In backdoor");
        if (item.blue_towel != 0){
            var dec_qty_blue = 'update inventory set qty = qty - $1 where product_id = $2';
            db.none(dec_qty_blue, [item.blue_towel, 'blue_towel'])
            req.session.qty_order.push(['Hand Towel, Blue', Number(item.blue_towel), 1000]);
            if (req.session.qty_desc == ''){
                req.session.qty_desc += 'Hand Towel, Blue X ' + item.blue_towel;
            } else {
                req.session.qty_desc += ' / Hand Towel, Blue X ' + item.blue_towel;
            }
            cost += 10 * item.blue_towel;
        }
        if (item.red_towel != 0){
            req.session.order_qty_size += 1;
            var dec_qty_red = 'update inventory set qty = qty - $1 where product_id = $2';
            db.none(dec_qty_red, [item.red_towel, 'red_towel'])
            req.session.qty_order.push(['Hand Towel, Red', Number(item.red_towel), 1000]);
            if (req.session.qty_desc == ''){
                req.session.qty_desc += 'Hand Towel, Red X ' + item.red_towel;
            } else {
                req.session.qty_desc += ' / Hand Towel, Red X ' + item.red_towel;
            }
            cost += item.red_towel * 10;
        }
        req.session.qty_order_id = item.order_name.substring(0, 3).toLowerCase() + String(Math.floor(Math.random() * (1 + 10000 - 1)) + 1);
        const qty_query = 'insert into orders (order_id, order_name, email, pay_status, bill_total, order_contents) values ($1, $2, $3, $4, $5, $6);';
        db.query(qty_query, [req.session.qty_order_id, req.session.qty_order_name, req.session.qty_order_email, 'PAID - Cash or ZP', cost, req.session.qty_desc])
            .then(function(rows){
                res.redirect('https://ema-store.herokuapp.com/views/qty_success.html');
            })
            .catch(function(err){
                console.log("Err in adding to db - qty: " + err);
                res.redirect('https://ema-store.herokuapp.com/quantity_cart.html')
            })
    } else {
        console.log("Normal customer");
        if (item.blue_towel != 0){
            req.session.order_qty_size += 1;
            var dec_qty_blue = 'update inventory set qty = qty - $1 where product_id = $2';
            db.none(dec_qty_blue, [item.blue_towel, 'blue_towel'])
            req.session.qty_order.push(['Hand Towel, Blue', Number(item.blue_towel), 1000]);
            if (req.session.qty_desc == ''){
                req.session.qty_desc += 'Hand Towel, Blue X ' + item.blue_towel;
            } else {
                req.session.qty_desc += ' / Hand Towel, Blue X ' + item.blue_towel;
            }
        }
        if (item.red_towel != 0){
            req.session.order_qty_size += 1;
            var dec_qty_red = 'update inventory set qty = qty - $1 where product_id = $2';
            db.none(dec_qty_red, [item.red_towel, 'red_towel'])
            req.session.qty_order.push(['Hand Towel, Red', Number(item.red_towel), 1000]);
            if (req.session.qty_desc == ''){
                req.session.qty_desc += 'Hand Towel, Red X ' + item.red_towel;
            } else {
                req.session.qty_desc += ' / Hand Towel, Red X ' + item.red_towel;
            }
        }
        req.session.qty_order_id = item.order_name.substring(0, 3).toLowerCase() + String(Math.floor(Math.random() * (1 + 10000 - 1)) + 1);
        const qty_query = 'insert into orders (order_id, order_name, email, pay_status, bill_total, order_contents) values ($1, $2, $3, $4, $5, $6);';
        db.query(qty_query, [req.session.qty_order_id, req.session.qty_order_name, req.session.qty_order_email, 'UNPAID', 0, req.session.qty_desc])
            .then(function(rows){
                res.redirect('https://ema-store.herokuapp.com/qty_checkout.html');
            })
            .catch(function(err){
                console.log("Err in adding to db - qty: " + err);
                res.redirect('https://ema-store.herokuapp.com/')
            })
    }
});
/*
router.post('/process_qty', function(req, res) {//hoodies
    req.session.order_qty_size = 0;
    var item = {
        order_name: req.sanitize('order_name').trim(),
        order_email: req.sanitize('order_email').trim(),
        white_ys: req.sanitize('white_ys').trim(),
        black_ys: req.sanitize('black_ys').trim(),
        white_ym: req.sanitize('white_ym').trim(),
        black_ym: req.sanitize('black_ym').trim(),
        white_yl: req.sanitize('white_yl').trim(),
        black_yl: req.sanitize('black_yl').trim(),
        //SEPERATOR
        black_as: req.sanitize('black_as').trim(),
        black_am: req.sanitize('black_am').trim(),
        black_al: req.sanitize('black_al').trim(),
        black_axl: req.sanitize('black_axl').trim(),
        black_axxl: req.sanitize('black_axxl').trim(),
        white_as: req.sanitize('white_as').trim(),
        white_am: req.sanitize('white_am').trim(),
        white_al: req.sanitize('white_al').trim(),
        white_axl: req.sanitize('white_axl').trim(),
        white_axxl: req.sanitize('white_axxl').trim(),
        //SEPERATOR
        red_towel: req.sanitize('red_towel').trim(),
        blue_towel: req.sanitize('blue_towel').trim()
    }
    req.session.qty_order = [];
    req.session.qty_order_name = item.order_name;
    req.session.qty_order_email = item.order_email;
    req.session.qty_desc = '';
    //YOUTH
    if (item.white_ys != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Youth Small, White', Number(item.white_ys), 40]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Youth Small, White X ' + item.white_ys;
        } else {
            req.session.qty_desc += ' / Youth Small, White X ' + item.white_ys;
        }
    }
    if (item.black_ys != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Youth Small, Black', Number(item.black_ys), 40]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Youth Small, Black X ' + item.black_ys;
        } else {
            req.session.qty_desc += ' / Youth Small, Black X ' + item.black_ys;
        }
    }
    if (item.white_ym != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Medium Small, White', Number(item.white_ym), 40]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Youth Medium, White X ' + item.white_ym;
        } else {
            req.session.qty_desc += ' / Youth Medium, White X ' + item.white_ym;
        }
    }
    if (item.black_ym != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Medium Small, Black', Number(item.black_ym), 40]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Youth Medium, Black X ' + item.black_ym;
        } else {
            req.session.qty_desc += ' / Youth Medium, Black X ' + item.black_ym;
        }
    }
    if (item.white_yl != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Youth Large, White', Number(item.white_yl), 40]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Youth Large, White X ' + item.white_yl;
        } else {
            req.session.qty_desc += ' / Youth Large, White X ' + item.white_yl;
        }
    }
    if (item.black_yl != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Youth Large, Black', Number(item.black_yl), 40]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Youth Large, Black X ' + item.black_yl;
        } else {
            req.session.qty_desc += ' / Youth Large, Black X ' + item.black_yl;
        }
    }
    //SEPERATOR
    if (item.black_as != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Adult Small, Black', Number(item.black_as), 55]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Adult Small, Black X ' + item.black_as;
        } else {
            req.session.qty_desc += ' / Adult Small, Black X ' + item.black_as;
        }
    }
    if (item.white_as != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Adult Small, White', Number(item.white_as), 55]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Adult Small, White X ' + item.white_as;
        } else {
            req.session.qty_desc += ' / Adult Small, White X ' + item.white_as;
        }
    }
    if (item.black_am != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Adult Medium, Black', Number(item.black_am), 55]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Adult Medium, Black X ' + item.black_am;
        } else {
            req.session.qty_desc += ' / Adult Medium, Black X ' + item.black_am;
        }
    }
    if (item.white_am != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Adult Medium, White', Number(item.white_am), 55]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Adult Medium, White X ' + item.white_am;
        } else {
            req.session.qty_desc += ' / Adult Medium, White X ' + item.white_am;
        }
    }
    if (item.black_al != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Adult Large, Black', Number(item.black_al), 55]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Adult Large, Black X ' + item.black_al;
        } else {
            req.session.qty_desc += ' / Adult Large, Black X ' + item.black_al;
        }
    }
    if (item.white_al != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Adult Large, White', Number(item.white_al), 55]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Adult Large, White X ' + item.white_al;
        } else {
            req.session.qty_desc += ' / Adult Large, White X ' + item.white_al;
        }
    }
    if (item.black_axl != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Adult X-Large, Black', Number(item.black_axl), 55]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Adult X-Large, Black X ' + item.black_axl;
        } else {
            req.session.qty_desc += ' / Adult X-Large, Black X ' + item.black_axl;
        }
    }
    if (item.white_axl != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Adult X-Large, White', Number(item.white_axl), 55]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Adult X-Large, White X ' + item.white_axl;
        } else {
            req.session.qty_desc += ' / Adult X-Large, White X ' + item.white_axl;
        }
    }
    if (item.black_axxl != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Adult XX-Large, Black', Number(item.black_axxl), 55]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Adult XX-Large, Black X ' + item.black_axxl;
        } else {
            req.session.qty_desc += ' / Adult XX-Large, Black X ' + item.black_axxl;
        }
    }
    if (item.white_axxl != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Adult XX-Large, White', Number(item.white_axxl), 55]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Adult XX-Large, White X ' + item.white_axxl;
        } else {
            req.session.qty_desc += ' / Adult XX-Large, White X ' + item.white_axxl;
        }
    }
    if (item.blue_towel != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Hand Towel, Blue', Number(item.blue_towel), 10]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Hand Towel, Blue X ' + item.blue_towel;
        } else {
            req.session.qty_desc += ' / Hand Towel, Blue X ' + item.blue_towel;
        }
    }
    if (item.red_towel != 0){
        req.session.order_qty_size += 1;
        req.session.qty_order.push(['Hand Towel, Red', Number(item.red_towel), 10]);
        if (req.session.qty_desc == ''){
            req.session.qty_desc += 'Hand Towel, Red X ' + item.red_towel;
        } else {
            req.session.qty_desc += ' / Hand Towel, Red X ' + item.red_towel;
        }
    }
    console.log('req.session.qty_order: ' + req.session.qty_order);
    console.log('Should be: desc, qty, desc, qty');
    console.log('req.session.qty_order[0][0]: ' + req.session.qty_order[0][0]);
    console.log('req.session.qty_order[0][1]: ' + req.session.qty_order[0][1]);
    console.log('req.session.qty_order[1][0]: ' + req.session.qty_order[1][0]);
    console.log('req.session.qty_order[1][1]: ' + req.session.qty_order[1][1]);
    console.log('req.session.order_qty_size = ' + req.session.order_qty_size);
    req.session.qty_order_id = item.order_name.substring(0, 3).toLowerCase() + String(Math.floor(Math.random() * (1 + 10000 - 1)) + 1);
    const qty_query = 'insert into orders (order_id, order_name, email, pay_status, bill_total, order_contents) values ($1, $2, $3, $4, $5, $6);';
    db.query(qty_query, [req.session.qty_order_id, req.session.qty_order_name, req.session.qty_order_email, 'UNPAID', 0, req.session.qty_desc])
        .then(function(rows){
            res.redirect('https://ema-store.herokuapp.com/qty_checkout.html');
        })
        .catch(function(err){
            console.log("Err in adding to db - qty: " + err);
            res.redirect('https://ema-store.herokuapp.com/')
        })
});
*/

router.get('/qty_checkout.html', function(req, res){
    res.render('qty_checkout.html', {

    })
});

router.post('/qty-create-session', async(req, res) => { //Hand Towel
    if (req.session.order_qty_size == 1){
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            client_reference_id: req.session.qty_order_id,
            customer_email: req.session.qty_order_email,
            line_items: [
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[0][0],
                    images: ['https://scontent.fapa1-2.fna.fbcdn.net/v/t1.0-9/142708276_10158908630253374_264610551351045715_o.jpg?_nc_cat=107&ccb=2&_nc_sid=825194&_nc_ohc=Yoaqnx29oxEAX-4O0OX&_nc_ht=scontent.fapa1-2.fna&oh=42ed29cbceb8bdb991142da3466724e7&oe=6036A938'],
                    description: '2021 Hand Towel'
                    },
                    unit_amount: Number(req.session.qty_order[0][2]),
                },
                quantity: Number(req.session.qty_order[0][1]),
                description: 'EMA Online Store',
                },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/views/qty_success.html`,
            cancel_url: `${YOUR_DOMAIN}/views/qty_cancel.html`,
            allow_promotion_codes: true,
            });
        res.json({ id: session.id });
        req.session.destroy();
    } else if (req.session.order_qty_size == 2){
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            client_reference_id: req.session.qty_order_id,
            customer_email: req.session.qty_order_email,
            line_items: [
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[0][0],
                    images: ['https://scontent.fapa1-2.fna.fbcdn.net/v/t1.0-9/142708276_10158908630253374_264610551351045715_o.jpg?_nc_cat=107&ccb=2&_nc_sid=825194&_nc_ohc=Yoaqnx29oxEAX-4O0OX&_nc_ht=scontent.fapa1-2.fna&oh=42ed29cbceb8bdb991142da3466724e7&oe=6036A938'],
                    description: '2021 Hand Towel'
                    },
                    unit_amount: Number(req.session.qty_order[0][2]),
                },
                quantity: Number(req.session.qty_order[0][1]),
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[1][0],
                    images: ['https://scontent.fapa1-2.fna.fbcdn.net/v/t1.0-9/142708276_10158908630253374_264610551351045715_o.jpg?_nc_cat=107&ccb=2&_nc_sid=825194&_nc_ohc=Yoaqnx29oxEAX-4O0OX&_nc_ht=scontent.fapa1-2.fna&oh=42ed29cbceb8bdb991142da3466724e7&oe=6036A938'],
                    description: '2021 Hand Towel'
                    },
                    unit_amount: Number(req.session.qty_order[1][2]),
                },
                quantity: Number(req.session.qty_order[1][1]),
                description: 'EMA Online Store',
                },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/views/qty_success.html`,
            cancel_url: `${YOUR_DOMAIN}/views/qty_cancel.html`,
            allow_promotion_codes: true,
            });
        
        res.json({ id: session.id });
        req.session.destroy();
    } else {
        console.log('3 or more different hand towels ordered. Advise on two different orders.');
        req.session.destroy();
        res.redirect('/');
    }
});
/*
router.post('/qty-create-session', async(req, res) => { //Hoodies
    if (req.session.order_qty_size == 1){
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            client_reference_id: req.session.qty_order_id,
            customer_email: req.session.qty_order_email,
            line_items: [
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[0][0],
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2021 Hoodie'
                    },
                    unit_amount: Number(req.session.qty_order[0][2]),
                },
                quantity: Number(req.session.qty_order[0][1]),
                description: 'EMA Online Store',
                },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/views/qty_success.html`,
            cancel_url: `${YOUR_DOMAIN}/views/qty_cancel.html`,
            allow_promotion_codes: true,
            });
        
        res.json({ id: session.id });
        req.session.destroy();
    } else if (req.session.order_qty_size == 2){
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            client_reference_id: req.session.qty_order_id,
            customer_email: req.session.qty_order_email,
            line_items: [
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[0][0],
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2021 Hoodie'
                    },
                    unit_amount: Number(req.session.qty_order[0][2]),
                },
                quantity: Number(req.session.qty_order[0][1]),
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[1][0],
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2021 Hoodie'
                    },
                    unit_amount: Number(req.session.qty_order[1][2]),
                },
                quantity: Number(req.session.qty_order[1][1]),
                description: 'EMA Online Store',
                },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/views/qty_success.html`,
            cancel_url: `${YOUR_DOMAIN}/views/qty_cancel.html`,
            allow_promotion_codes: true,
            });
        
        res.json({ id: session.id });
        req.session.destroy();
    } else if (req.session.order_qty_size == 3){
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            client_reference_id: req.session.qty_order_id,
            customer_email: req.session.qty_order_email,
            line_items: [
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[0][0],
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2021 Hoodie'
                    },
                    unit_amount: Number(req.session.qty_order[0][2]) * 100,
                },
                quantity: Number(req.session.qty_order[0][1]),
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[1][0],
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2021 Hoodie'
                    },
                    unit_amount: Number(req.session.qty_order[1][2]) * 100,
                },
                quantity: Number(req.session.qty_order[1][1]),
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[2][0],
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2021 Hoodie'
                    },
                    unit_amount: Number(req.session.qty_order[2][2]) * 100,
                },
                quantity: Number(req.session.qty_order[2][1]),
                description: 'EMA Online Store',
                },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/views/qty_success.html`,
            cancel_url: `${YOUR_DOMAIN}/views/qty_cancel.html`,
            allow_promotion_codes: true,
            });
        
        res.json({ id: session.id });
        req.session.destroy();
    } else if (req.session.order_size == 4){
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            client_reference_id: req.session.qty_order_id,
            customer_email: req.session.qty_order_email,
            line_items: [
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[0][0],
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2021 Hoodie'
                    },
                    unit_amount: Number(req.session.qty_order[0][2]) * 100,
                },
                quantity: Number(req.session.qty_order[0][1]),
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[1][0],
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2021 Hoodie'
                    },
                    unit_amount: Number(req.session.qty_order[1][2]) * 100,
                },
                quantity: Number(req.session.qty_order[1][1]),
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[2][0],
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2021 Hoodie'
                    },
                    unit_amount: Number(req.session.qty_order[2][2]) * 100,
                },
                quantity: Number(req.session.qty_order[2][1]),
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[3][0],
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2021 Hoodie'
                    },
                    unit_amount: Number(req.session.qty_order[3][2]) * 100,
                },
                quantity: Number(req.session.qty_order[3][1]),
                description: 'EMA Online Store',
                },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/views/qty_success.html`,
            cancel_url: `${YOUR_DOMAIN}/views/qty_cancel.html`,
            allow_promotion_codes: true,
            });
        
        res.json({ id: session.id });
        req.session.destroy();
    } else if (req.session.order_size == 5){
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            client_reference_id: req.session.qty_order_id,
            customer_email: req.session.qty_order_email,
            line_items: [
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[0][0],
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2021 Hoodie'
                    },
                    unit_amount: Number(req.session.qty_order[0][2]) * 100,
                },
                quantity: Number(req.session.qty_order[0][1]),
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[1][0],
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2021 Hoodie'
                    },
                    unit_amount: Number(req.session.qty_order[1][2]) * 100,
                },
                quantity: Number(req.session.qty_order[1][1]),
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[2][0],
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2021 Hoodie'
                    },
                    unit_amount: Number(req.session.qty_order[2][2]) * 100,
                },
                quantity: Number(req.session.qty_order[2][1]),
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[3][0],
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2021 Hoodie'
                    },
                    unit_amount: Number(req.session.qty_order[3][2]) * 100,
                },
                quantity: Number(req.session.qty_order[3][1]),
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.qty_order[4][0],
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2021 Hoodie'
                    },
                    unit_amount: Number(req.session.qty_order[4][2]) * 100,
                },
                quantity: Number(req.session.qty_order[4][1]),
                description: 'EMA Online Store',
                },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/views/qty_success.html`,
            cancel_url: `${YOUR_DOMAIN}/views/qty_cancel.html`,
            allow_promotion_codes: true,
            });
        
        res.json({ id: session.id });
        req.session.destroy();
    } else {
        console.log('6 or more different hoodies ordered. Advise on two different orders.');
        req.session.destroy();
        res.redirect('/');
    }
});
*/
router.post('/process_cart', function(req, res) {
    if (!req.session){
        app.use(
            session({
                store: new RedisStore({ 
                    client: client,
                    ttl: 5 * 60
                }),
            secret: process.env.secret_key,
            resave: true,
            saveUninitialized: true
            })
        );
    }
    req.session.order_size = 0;
    var item = {
        order_name: req.sanitize('order_name').trim(),
        order_email: req.sanitize('order_email').trim(),
        quantity1: req.sanitize('quantity1'),
        color1: req.sanitize('color1'),
        size1: req.sanitize('size1'),
        quantity2: req.sanitize('quantity2'),
        color2: req.sanitize('color2'),
        size2: req.sanitize('size2'),
        quantity3: req.sanitize('quantity3'),
        color3: req.sanitize('color3'),
        size3: req.sanitize('size3'),
        quantity4: req.sanitize('quantity4'),
        color4: req.sanitize('color4'),
        size4: req.sanitize('size4')
    }
    console.log('session key after redirect ' + req.session.key);
    req.session.email_name = item.order_email;
    req.session.order_name = item.order_name;
    console.log('order size is ' + req.session.order_size);
    if (item.quantity1 != 0) {
        req.session.order_size = req.session.order_size + 1;
        var temp_q1  = item.quantity1;
        req.session.q1 = Number(temp_q1);
        var temp_d1 = item.color1 + ' ' + item.size1;
        req.session.d1 = String(temp_d1);
        console.log('order 1 data: ' + req.session.q1 + '/' + req.session.d1 + '/' + req.session.order_size);
        if ((item.size1 == 'Youth Small') || (item.size1 == 'Youth Medium') || (item.size1 == 'Youth Large')){
            req.session.p1 = 4000;
        } else {
            req.session.p1 = 5500;
        }
        console.log('price is ' + req.session.p1);
    }
    if (item.quantity2 != 0) {
        req.session.order_size = req.session.order_size + 1;
        var temp_q2 = item.quantity2;
        req.session.q2 = Number(temp_q2);
        var temp_d2 = item.color2 + ' ' + item.size2;
        req.session.d2 = String(temp_d2);
        if ((item.size2 == 'Youth Small') || (item.size2 == 'Youth Medium') || (item.size2 == 'Youth Large')){
            req.session.p2 = 4000;
        } else {
            req.session.p2 = 5500;
        }
    }
    if (item.quantity3 != 0) {
        req.session.order_size = req.session.order_size + 1;
        var temp_q3 = item.quantity3;
        req.session.q3 = Number(temp_q3);
        var temp_d3 = item.color3 + ' ' + item.size3;
        req.session.d3 = String(temp_d3);
        if ((item.size3 == 'Youth Small') || (item.size3 == 'Youth Medium') || (item.size3 == 'Youth Large')){
            req.session.p3 = 4000;
        } else {
            req.session.p3 = 5500;
        }
    }
    if (item.quantity4 != 0) {
        req.session.order_size = req.session.order_size + 1;
        var temp_q4 = item.quantity4;
        req.session.q4 = Number(temp_q4);
        var temp_d4= item.color4 + ' ' + item.size4;
        req.session.d4 = String(temp_d4);
        if ((item.size4 == 'Youth Small') || (item.size4 == 'Youth Medium') || (item.size4 == 'Youth Large')){
            req.session.p4 = 4000;
        } else {
            req.session.p4 = 5500;
        }
    }
    req.session.order_id = item.order_name.substring(0, 3).toLowerCase() + String(Math.floor( Math.random() * ( 1 + 10000 - 1 ) ) + 1);
    console.log('order_id is ' + req.session.order_id);
    /*
    switch (req.session.order_size){
        case 1:
            //Build description of order 1x black order_size[2].replace("_" ," ")
            var item_description = String(req.session.order_desc[0]) + ' x ' + String(req.session.order_desc[1]).replace("_" ," ") + ' ' + req.session.order_desc[2];
            break;
        case 2:
            var item_description = String(order_desc[0]) + ' x ' + String(order_desc[1]).replace("_" ," ") + ' ' + order_desc[2] + "\r\n" + String(order_desc[3]) + ' x ' + String(order_desc[4]).replace("_" ," ") + ' ' + order_desc[5];
            break;
        case 3:
            var item_description = String(order_desc[0]) + ' x ' + String(order_desc[1]).replace("_" ," ") + ' ' + order_desc[2] + '\n' + String(order_desc[3]) + ' x ' + String(order_desc[4]).replace("_" ," ") + ' ' + order_desc[5] + '\n' + String(order_desc[6]) + ' x ' + String(order_desc[7]).replace("_" ," ") + ' ' + order_desc[8];
            break;
        case 4:
            var item_description = String(order_desc[0]) + ' x ' + String(order_desc[1]).replace("_" ," ") + ' ' + order_desc[2] + '\n' + String(order_desc[3]) + ' x ' + String(order_desc[4]).replace("_" ," ") + ' ' + order_desc[5] + '\n' + String(order_desc[6]) + ' x ' + String(order_desc[7]).replace("_" ," ") + ' ' + order_desc[8] + '\n' + String(order_desc[9]) + ' x ' + String(order_desc[10]).replace("_" ," ") + ' ' + order_desc[11];
            break;
        default:
            var item_description = 'Could not get order quantity and description.';
            break;
    }
    */
    //req.session.order_desc = item_description;
    JSON.safeStringify = (obj, indent = 2) => {
        let cache = [];
        const retVal = JSON.stringify(
            obj,
            (key, value) =>
                typeof value === "object" && value !== null
                ? cache.includes(value)
                    ? undefined // Duplicate reference found, discard key
                    : cache.push(value) && value // Store value in our collection
                : value,
            indent
        );
        cache = null;
        return retVal;
    };
    
      // Example:
    console.log('req.session', JSON.safeStringify(req.session));
    switch (req.session.order_size){
        case 1:
            var order_contents = String(req.session.q1 + ' ' + req.session.d1);
            break;
        case 2:
            var order_contents = String(req.session.q1 + ' ' +  req.session.d1 + ' / ' + req.session.q2 + ' ' +  req.session.d2);
            break;
        case 3: 
            var order_contents = String(req.session.q1 + ' ' +  req.session.d1 + ' / ' + req.session.q2 + ' ' +  req.session.d2 + ' / ' + req.session.q3 + ' ' +  req.session.d3);
            break;
        case 4: 
            var order_contents = String(req.session.q1 + ' ' +  req.session.d1 + ' / ' + req.session.q2 + ' ' +  req.session.d2 + ' / ' + req.session.q3 + ' ' +  req.session.d3 + ' / ' + req.session.q4 + ' ' +  req.session.d4);
            break;
        default:
            var order_contents = 'Unable to gather order information';
            break;
    }
    console.log('order contents are ' + order_contents);
    let amount = ((req.session.q1 * req.session.p1) + (req.session.q2 * req.session.p2) + (req.session.q3 * req.session.p3) + (req.session.q4 * req.session.p4));
    var final = '$' + String(amount).substring(0, amount.length - 2) + '.' + String(amount).substring(amount.length - 2, amount.length);
    console.log('final in process is ' + final);
    const query = 'insert into orders (order_id, order_name, email, pay_status, bill_total, order_contents) values ($1, $2, $3, $4, $5, $6);';
    db.query(query, [req.session.order_id, req.session.order_name, req.session.email_name, 'UNPAID', 0, order_contents])
        .then(function(rows){
            res.redirect('https://ema-store.herokuapp.com/checkout.html');
        })
        .catch(function(err){
            console.log("Err in adding to db: " + err);
            res.redirect('https://ema-store.herokuapp.com/');
        })
});

router.get('/checkout.html', function(req, res){
    console.log('final in checkout is ' + req.params.final);
    switch (req.session.order_size){
        case 1:
            var amount = (req.session.q1 * req.session.p1);
            break;
        case 2:
            var amount = (req.session.q1 * req.session.p1) + (req.session.q2 * req.session.p2);
            break;
        case 3:
            var amount = (req.session.q1 * req.session.p1) + (req.session.q2 * req.session.p2) + (req.session.q3 * req.session.p3);
            break;
        case 4:
            var amount = (req.session.q1 * req.session.p1) + (req.session.q2 * req.session.p2) + (req.session.q3 * req.session.p3) + (req.session.q4 * req.session.p4);
            break;
        default:
            res.redirect('/');
            break;
    }
    var final = '$' + String(amount).substring(0, String(amount).length - 2) + '.' + String(amount).substring(String(amount).length - 2, String(amount).length);
    res.render('checkout.html', {
        price: final
    })
});

router.post('/create-session', async (req, res) => {
    //var local_price = req.session.order_price;
    //var local_desc = String(req.session.order_desc);
    //console.log('local_price is ' + local_price);
    if (req.session.order_size == 1){
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            client_reference_id: req.session.order_id,
            customer_email: req.session.email_name,
            line_items: [
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.d1,
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2020 Hoodie'
                    },
                    unit_amount: req.session.p1,
                },
                quantity: req.session.q1,
                description: 'EMA Online Store',
                },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/success.html`,
            cancel_url: `${YOUR_DOMAIN}/cancel.html`,
            allow_promotion_codes: true,
            });
        
        res.json({ id: session.id });
        req.session.destroy();
    } else if (req.session.order_size == 2){
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            client_reference_id: req.session.order_id,
            customer_email: req.session.email_name,
            line_items: [
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.d1,
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2020 Hoodie'
                    },
                    unit_amount: req.session.p1,
                },
                quantity: req.session.q1,
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.d2,
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2020 Hoodie'
                    },
                    unit_amount: req.session.p2,
                },
                quantity: req.session.q2,
                description: 'EMA Online Store',
                },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/success.html`,
            cancel_url: `${YOUR_DOMAIN}/cancel.html`,
            allow_promotion_codes: true,
            });
        
        res.json({ id: session.id });
        req.session.destroy();
    } else if (req.session.order_size == 3){
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            client_reference_id: req.session.order_id,
            customer_email: req.session.email_name,
            line_items: [
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.d1,
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2020 Hoodie'
                    },
                    unit_amount: req.session.p1,
                },
                quantity: req.session.q1,
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.d2,
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2020 Hoodie'
                    },
                    unit_amount: req.session.p2,
                },
                quantity: req.session.q2,
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.d3,
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2020 Hoodie'
                    },
                    unit_amount: req.session.p3,
                },
                quantity: req.session.q3,
                description: 'EMA Online Store',
                },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/success.html`,
            cancel_url: `${YOUR_DOMAIN}/cancel.html`,
            allow_promotion_codes: true,
            });
        
        res.json({ id: session.id });
        req.session.destroy();
    } else if (req.session.order_size == 4){
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            client_reference_id: req.session.order_id,
            customer_email: req.session.email_name,
            line_items: [
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.d1,
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2020 Hoodie'
                    },
                    unit_amount: req.session.p1,
                },
                quantity: req.session.q1,
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.d2,
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2020 Hoodie'
                    },
                    unit_amount: req.session.p2,
                },
                quantity: req.session.q2,
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.d3,
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2020 Hoodie'
                    },
                    unit_amount: req.session.p3,
                },
                quantity: req.session.q3,
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: req.session.d4,
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2020 Hoodie'
                    },
                    unit_amount: req.session.p4,
                },
                quantity: req.session.q4,
                description: 'EMA Online Store',
                },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/success.html`,
            cancel_url: `${YOUR_DOMAIN}/cancel.html`,
            allow_promotion_codes: true,
            });
        
        res.json({ id: session.id });
        req.session.destroy();
    } else {
        req.session.destroy();
        res.redirect('https://ema-store.herokuapp.com/cancel.html');
    }
    //req.session.destroy();
});
router.get('/success.html', function(req, res){
    //req.session.destroy();
    res.render('success.html', {
    })
});

router.post('/webhook', (req, res) => {
    let event;
    try {
        console.log('event is ' + event);
    } catch(err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
    console.log('req.body.type is ' + req.body.type);
    switch(req.body.type){
        case 'checkout.session.completed':
            console.log('PAYMENT STATUS: ' + req.body.data.object.payment_status);
            let payment_status = req.body.data.object.payment_status.toUpperCase();
            let order_id = req.body.data.object.client_reference_id;
            let email = req.body.data.object.customer_email;
            let amount_total = Number(req.body.data.object.amount_total) / 100;
            let intent = req.body.data.object.payment_intent;
            let checkout_query = 'update orders set pay_status = $1, bill_total = $2, payment_intent = $3 where order_id = $4 and email = $5;';
            db.query(checkout_query, [payment_status.toUpperCase(), amount_total, intent, order_id, email])
                .then(function(rows){
                    console.log('Payment made for ' + email);
                    res.status(200).send();
                })
                .catch(function(err){
                    console.log('Error updating checkout session webhook ' + err);
                    res.status(400).send(`Webhook Error: ${err}`);
                })
            break;
        case 'charge.refunded':
            var payment_intent = req.body.data.object.payment_intent;
            var email_refund = req.body.data.object.billing_details.email;
            var refunded = Number(req.body.data.object.amount_refunded) / 100;
            console.log('amount refunded = ' + String(refunded));
            console.log('payment_intent refunded: ' + payment_intent);
            console.log('email is ' + email_refund);
            let refund_query = 'update orders set pay_status = $1, bill_total = bill_total - $2, order_contents = $3 where payment_intent = $4 and email = $5;';
            db.query(refund_query, ['REFUNDED', refunded, 'NONE - ORDER REFUNDED',payment_intent, email_refund])
                .then(function(rows){
                    JSON.safeStringify = (obj, indent = 2) => {
                        let cache = [];
                        const retVal = JSON.stringify(
                            obj,
                            (key, value) =>
                                typeof value === "object" && value !== null
                                ? cache.includes(value)
                                    ? undefined // Duplicate reference found, discard key
                                    : cache.push(value) && value // Store value in our collection
                                : value,
                            indent
                        );
                        cache = null;
                        return retVal;
                    };
                    
                      // Example:
                    console.log('rows', JSON.safeStringify(rows));
                    console.log('Refund sent');
                    res.status(200).send();
                })
                .catch(function(err){
                    console.log('Error updating refund webhook ' + err);
                    res.status(400).send(`Webhook Error: ${err}`);
                })
            break;
        default:
            break;
    }
    res.json({recieved: true});
})

app.listen(process.env.PORT, () => console.log('Running on port ' + process.env.PORT));