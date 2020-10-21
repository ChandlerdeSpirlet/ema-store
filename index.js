const stripe = require('stripe')('sk_test_51H75ScKv0edLDEqJEL6q5HTs0dJN28eeyehpgMBEdEc4BT26iod0kUZpE3zcL0QrwZtwV7kCFTbS7bfb8Ehs6lys00Ut3Az4SN');
const exp_val = require('express-validator');
const express = require('express');
const bodyParser = require('body-parser');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const session = require('express-session');
var redis = require('redis');
const { json } = require('body-parser');
var client = redis.createClient(process.env.REDIS_URL);
var RedisStore = require('connect-redis')(session);
const app = express();
app.use(express.static('.'));
app.set('views', __dirname + '/');
app.use(exp_val());

app.use(
    session({
        store: new RedisStore({ 
            client: client
        }),
    secret: process.env.secret_key,
    resave: false,
    saveUninitialized: false
    })
);

app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'html');
app.engine('html', nunjucks.render);
nunjucks.configure('/', {noCache: true});

const YOUR_DOMAIN = 'https://ema-store.herokuapp.com';

app.get('/', function(req, res){
    req.session.key = Math.floor( Math.random() * ( 1 + 10000 - 1 ) ) + 1;
    console.log('session key is ' + req.session.key);
    req.session.order_size = 0;
    res.redirect('https://ema-store.herokuapp.com/shopping_cart.html');
})

app.post('/process_cart', function(req, res) {
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
    console.log('session ket after redirect ' + req.session.key);
    req.session.email_name = item.order_email;
    console.log('order size is ' + req.session.order_size);
    if (item.quantity1 != 0) {
        req.session.order_size = req.session.order_size + 1;
        var temp_q1  = item.quantity1;
        req.session.q1 = Number(temp_q1);
        var temp_d1 = item.color1 + ' ' + item.size1;
        req.session.d1 = String(temp_d1);
        let sess = req.session;
        console.log('order 1 data: ' + sess.q1 + '/' + sess.d1 + '/' + sess.order_size);
        if ((item.size1 == 'Youth Small') || (item.size1 == 'Youth Medium') || (item.size1 == 'Youth Large')){
            sess.p1 = 4000;
        } else {
            sess.p1 = 5500;
        }
        console.log('price is ' + sess.p1);
    }
    if (item.quantity2 != 0) {
        req.session.order_size = req.session.order_size + 1;
        req.session.q2 = item.quantity2;
        req.session.d2 = item.color2 + ' ' + item.size2;
        if ((item.size2 == 'Youth Small') || (item.size2 == 'Youth Medium') || (item.size2 == 'Youth Large')){
            req.session.p2 = 4000;
        } else {
            req.session.p2 = 5500;
        }
    }
    if (item.quantity3 != 0) {
        req.session.order_size = req.session.order_size + 1;
        req.session.q3 = item.quantity3;
        req.session.d3 = item.color3 + ' ' + item.size3;
        if ((item.size3 == 'Youth Small') || (item.size3 == 'Youth Medium') || (item.size3 == 'Youth Large')){
            req.session.p3 = 4000;
        } else {
            req.session.p3 = 5500;
        }
    }
    if (item.quantity4 != 0) {
        req.session.order_size = req.session.order_size + 1;
        req.session.q4 = item.quantity4;
        req.session.d4 = item.color4 + ' ' +  item.size4;
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
      console.log('req.session', JSON.safeStringify(req.session))
    
    res.redirect('https://ema-store.herokuapp.com/checkout.html');
});

app.get('/checkout.html', function(req, res){
    res.render('checkout.html', {
    })
});

app.post('/create-session', async (req, res) => {
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
            });
        
        res.json({ id: session.id });
        req.session.destroy();
    } else {
        req.session.destroy();
        res.redirect('https://ema-store.herokuapp.com/cancel.html');
    }
});

app.listen(process.env.PORT, () => console.log('Running on port ' + process.env.PORT));