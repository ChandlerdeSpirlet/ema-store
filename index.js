const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const express = require('express');
const exp_val = require('express-validator');
const app = express();
app.use(express.static('.'));
app.use(exp_val());

const YOUR_DOMAIN = 'https://ema-store.herokuapp.com';
global.order_size = 0;
global.order_desc = [];
global.order_price = 0;
global.order_id = '';

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
    if (item.quantity1 != 0) {
        order_size++;
        order_desc.push(item.quantity1);
        order_desc.push(item.size1);
        order_desc.push(item.color1);
        if ((item.size1 == 'youth_small') || (item.size1 == 'youth_medium') || (item.size1 == 'youth_large')){
            order_price = order_price + (4000 * item.quantity1); //Represents $40 * quantity
        } else {
            order_price = order_price + (5500 * item.quantity1); //Represents $50 * quantity
        }
    }
    if (item.quantity2 != 0) {
        order_size++;
        order_desc.push(item.quantity2);
        order_desc.push(item.size2);
        order_desc.push(item.color2);
        if ((item.size2 == 'youth_small') || (item.size2 == 'youth_medium') || (item.size2 == 'youth_large')){
            order_price = order_price + (4000 * item.quantity2);
        } else {
            order_price = order_price + (5500 * item.quantity2);
        }
    }
    if (item.quantity3 != 0) {
        order_size++;
        order_desc.push(item.quantity3);
        order_desc.push(item.size3);
        order_desc.push(item.color3);
        if ((item.size3 == 'youth_small') || (item.size3 == 'youth_medium') || (item.size3 == 'youth_large')){
            order_price = order_price + (4000 * item.quantity3);
        } else {
            order_price = order_price + (5500 * item.quantity3);
        }
    }
    if (item.quantity4 != 0) {
        order_size++;
        order_desc.push(item.quantity4);
        order_desc.push(item.size4);
        order_desc.push(item.color4);
        if ((item.size4 == 'youth_small') || (item.size4 == 'youth_medium') || (item.size4 == 'youth_large')){
            order_price = order_price + (4000 * item.quantity4);
        } else {
            order_price = order_price + (5500 * item.quantity4);
        }
    }
    const order_id = item.order_name.substring(0, 3) + String(Math.floor( Math.random() * ( 1 + 10000 - 1 ) ) + 1);
    console.log('order size in process_cart is ' + order_size);
    res.redirect('https://ema-store.herokuapp.com/checkout.html');
});

app.get('/checkout.html', function(req, res){

});

app.post('/create-session', async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
            price_data: {
                currency: 'usd',
                product_data: {
                name: 'EMA Online Store',
                images: ['https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121185484_10158652691288374_6371473402707957527_n.jpg?_nc_cat=111&_nc_sid=b9115d&_nc_ohc=s87FZ63TNKwAX9Dv8Ht&_nc_ht=scontent.fapa1-1.fna&oh=f6382a44ace51f3e269042529ba750b2&oe=5FAA9A15', 'https://scontent.fapa1-1.fna.fbcdn.net/v/t1.0-9/121239752_10158652691348374_2337616342705280587_n.jpg?_nc_cat=101&_nc_sid=b9115d&_nc_ohc=BRf6f4sxNccAX_lGh63&_nc_ht=scontent.fapa1-1.fna&oh=c5a4d7fdc585bb0c80c3d1677dafab61&oe=5FAB83B9'],
                description: 'EMA Desc',
                },
                unit_amount: 2000,
            },
            quantity: 1,
            description: '2020 EMA Hoodie'
            },
        ],
        mode: 'payment',
        success_url: `${YOUR_DOMAIN}/success.html`,
        cancel_url: `${YOUR_DOMAIN}/cancel.html`,
        });
    
    res.json({ id: session.id });
});

app.listen(process.env.PORT, () => console.log('Running on port ' + process.env.PORT));