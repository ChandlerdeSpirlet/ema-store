const stripe = require('stripe')('sk_test_51H75ScKv0edLDEqJEL6q5HTs0dJN28eeyehpgMBEdEc4BT26iod0kUZpE3zcL0QrwZtwV7kCFTbS7bfb8Ehs6lys00Ut3Az4SN');
const express = require('express');
const exp_val = require('express-validator');
const bodyParser = require('body-parser');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv')
const app = express();
app.use(express.static('.'));
app.use(exp_val());
app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'html');
app.engine('html', nunjucks.render);
nunjucks.configure('/', {noCache: true});

const YOUR_DOMAIN = 'https://ema-store.herokuapp.com';
global.order_info = {
    order_name: '',
    order_email: '',
    order_size: 0,
    order_id: '',
    quantity1: 0,
    price1: 0,
    descriptor1: '',
    quantity2: 0,
    price2: 0,
    descriptor2: '',
    quantity3: 0,
    price3: 0,
    descriptor3: '',
    quantity4: 0,
    price4: 0,
    descriptor4: ''
};

app.get('/', function(req, res){
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
    order_info.order_name = item.order_name;
    order_info.order_email = item.order_email;
    if (item.quantity1 != 0) {
        order_info.order_size++;
        if ((item.size1 == 'Youth Small') || (item.size1 == 'Youth Medium') || (item.size1 == 'Youth Large')){
            order_info.price1 = 4000;
        } else {
            order_info.price2 = 5500;
        }
        order_info.quantity1 = item.quantity1;
        order_info.descriptor1 = String(item.size1) + ', ' + String(item.color1);
    }
    if (item.quantity2 != 0) {
        order_info.order_size++;
        if ((item.size2 == 'Youth Small') || (item.size2 == 'Youth Medium') || (item.size2 == 'Youth Large')){
            order_info.price2 = 4000;
        } else {
            order_info.price2 = 5500;
        }
        order_info.quantity2 = item.quantity2;
        order_info.descriptor2 = String(item.size2) + ', ' + String(item.color2);
    }
    if (item.quantity3 != 0) {
        order_info.order_size++;
        if ((item.size3 == 'Youth Small') || (item.size3 == 'Youth Medium') || (item.size3 == 'Youth Large')){
            order_price.price3 = 4000;
        } else {
            order_price.price3 = 5500;
        }
        order_info.quantity3 = item.quantity3;
        order_info.descriptor3 = String(item.size3) + ', ' + String(item.color3);
    }
    if (item.quantity4 != 0) {
        order_info.order_size++;
        if ((item.size4 == 'Youth Small') || (item.size4 == 'Youth Medium') || (item.size4 == 'Youth Large')){
            order_info.price4 = 4000;
        } else {
            order_info.price4 = 5500;
        }
        order_info.quantity4 = item.quantity4;
        order_info.descriptor4 = String(item.size4) + ', ' + String(item.color4);
    }
    order_info.order_id = item.order_name.substring(0, 3) + String(Math.floor( Math.random() * ( 1 + 10000 - 1 ) ) + 1);
    console.log('order_size ' + order_info.order_size);
    res.redirect('/checkout.html');
});

app.get('/checkout.html', function(req, res){
    res.render('checkout.html', {
        
    })
});

app.post('/create-session', async (req, res) => {
    const local_order = order_info;
    delete order_info;
    switch (local_order.order_size){
        case 1:
            var session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                customer_email: 'local_order.order_email',
                client_reference_id: 'local_order.order_id',
                line_items: [
                    {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                        name: 'local_order.descriptor1',
                        images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                        description: '2020 Hoodie',
                        },
                        unit_amount: 500,
                    },
                    quantity: 'local_order.quantity1',
                    description: 'EMA Online Store',
                    },
                ],
                mode: 'payment',
                metadata: {'order_id': 'local_order.order_id'},
                success_url: `${YOUR_DOMAIN}/success.html`,
                cancel_url: `${YOUR_DOMAIN}/cancel.html`,
            });
            
            res.json({ id: session.id });
            break;
        case 2:
            var session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                customer_email: local_order.order_email,
                client_reference_id: local_order.order_id,
                line_items: [
                    {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                        name: local_order.descriptor1,
                        images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                        description: '2020 Hoodie',
                        },
                        unit_amount: local_order.price1,
                    },
                    quantity: local_order.quantity1,
                    description: 'EMA Online Store',
                    },
                    {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                        name: local_order.descriptor2,
                        images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                        description: '2020 Hoodie',
                        },
                        unit_amount: local_order.price2,
                    },
                    quantity: local_order.quantity2,
                    description: 'EMA Online Store',
                    },
                ],
                mode: 'payment',
                metadata: {'order_id': local_order.order_id},
                success_url: `${YOUR_DOMAIN}/success.html`,
                cancel_url: `${YOUR_DOMAIN}/cancel.html`,
            });
            
            res.json({ id: session.id });
            break;
        case 3:
            var session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                customer_email: local_order.order_email,
                client_reference_id: local_order.order_id,
                line_items: [
                    {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                        name: local_order.descriptor1,
                        images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                        description: '2020 Hoodie',
                        },
                        unit_amount: local_order.price1,
                    },
                    quantity: local_order.quantity1,
                    description: 'EMA Online Store',
                    },
                    {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                        name: local_order.descriptor2,
                        images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                        description: '2020 Hoodie',
                        },
                        unit_amount: local_order.price2,
                    },
                    quantity: local_order.quantity2,
                    description: 'EMA Online Store',
                    },
                    {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                        name: local_order.descriptor3,
                        images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                        description: '2020 Hoodie',
                        },
                        unit_amount: local_order.price3,
                    },
                    quantity: local_order.quantity3,
                    description: 'EMA Online Store',
                    },
                ],
                mode: 'payment',
                metadata: {'order_id': local_order.order_id},
                success_url: `${YOUR_DOMAIN}/success.html`,
                cancel_url: `${YOUR_DOMAIN}/cancel.html`,
            });
            
            res.json({ id: session.id });
            break;
        case 4: 
        var session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: local_order.order_email,
            client_reference_id: local_order.order_id,
            line_items: [
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: local_order.descriptor1,
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2020 Hoodie',
                    },
                    unit_amount: local_order.price1,
                },
                quantity: local_order.quantity1,
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: local_order.descriptor2,
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2020 Hoodie',
                    },
                    unit_amount: local_order.price2,
                },
                quantity: local_order.quantity2,
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: local_order.descriptor3,
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2020 Hoodie',
                    },
                    unit_amount: local_order.price3,
                },
                quantity: local_order.quantity3,
                description: 'EMA Online Store',
                },
                {
                price_data: {
                    currency: 'usd',
                    product_data: {
                    name: local_order.descriptor4,
                    images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                    description: '2020 Hoodie',
                    },
                    unit_amount: local_order.price4,
                },
                quantity: local_order.quantity4,
                description: 'EMA Online Store',
                },
            ],
            mode: 'payment',
            metadata: {'order_id': local_order.order_id},
            success_url: `${YOUR_DOMAIN}/success.html`,
            cancel_url: `${YOUR_DOMAIN}/cancel.html`,
        });
        
        res.json({ id: session.id });
            break;
        default:
            console.log('Could not read local_order.order_size');
            res.redirect('https://ema-store.herokuapp.com/cancel.html');
            break;
    }
});

app.listen(process.env.PORT, () => console.log('Running on port ' + process.env.PORT));
//app.listen(666, () => console.log('Running on port ' + 666));