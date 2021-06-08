const PUBLIC_KEY="FLWPUBK-f38696e4ca54b92fb4d9ea481a0861fc-X"
const SECRET_KEY="FLWSECK-a25f9d49d1e17f0d1a0e355f42777385-X"
const Flutterwave = require('flutterwave-node-v3');

const flw = new Flutterwave(PUBLIC_KEY, SECRET_KEY);



const Gh_mobilemoney =  async () =>{
 
    try {

        const payload = {
            "tx_ref": "MC-158523s09v5050e8",
            "amount": "1.0",
            "type": "mobile_money_ghana",
            "currency": "GHS",
            "voucher": "143256743",
            "network": "MTN", //This is the customer's mobile money network provider (possible values: MTN, VODAFONE, TIGO)
            "email": "user@gmail.com",
            "phone_number": "0246384650",
            "fullname": "John Madakin",
            "client_ip": "154.123.220.1",
            "device_fingerprint": "62wd23423rq324323qew1",
            "meta": {
                "flightID": "213213AS"
            }
    }

       const response =  await flw.MobileMoney.ghana(payload)
       console.log(response);
    } catch (error) {
        console.log(error)
    }                            
   
}
 

Gh_mobilemoney();