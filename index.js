const stripe = require('stripe')('sk_test_51H75ScKv0edLDEqJEL6q5HTs0dJN28eeyehpgMBEdEc4BT26iod0kUZpE3zcL0QrwZtwV7kCFTbS7bfb8Ehs6lys00Ut3Az4SN');
const express = require('express');
const app = express();
app.use(express.static('.'));

const YOUR_DOMAIN = 'https://ema-store.herokuapp.com'

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