const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const app = express();
const stripe = require("stripe")(process.env.GATEWAY_SECRET_KEY);
const port = process.env.PORT || 3000;


const morgan = require('morgan');

app.use(morgan('dev'))
app.use(cors());
app.use(express.json());

const multer  = require('multer')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  }
})

const upload = multer({ storage: storage })


app.get('/', (req,res)=> {
    res.send('emars is runnig')
} )

const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@cluster0.jxd6utg.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db("emarseDB").collection("usersCollection")
    const productsCollection = client.db("emarseDB").collection("productsCollection")
    const cartsCollection = client.db("emarseDB").collection("cartsCollection")
    const reviewsCollection = client.db("emarseDB").collection("reviewsCollection")
    const paymentsCollection = client.db("emarseDB").collection("paymentsCollection")
    app.post('/jwt', (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
        res.send({token})
    })

    const verifyJWT = (req, res, next) => {
        const authorization = req.headers.authorization;
        if(!authorization){
            return res.status(401).send({error: true, message: 'unauthorized accesssss'})
        }
         //bearer token
         const token = authorization.split(' ')[1];

         jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=> {
            if(err){
                return res.status(401).send({error: true, message: "illigal access"})
            }
            req.decoded = decoded;
            next();
         })
    }
     //users
    app.post("/users", async(req, res) => {
        const users = req.body;
        console.log(users, req)
        const result = await usersCollection.insertOne(users);
        res.send(result);
    })

    app.get("/users", async(req, res) => {
        const result = await usersCollection.find().toArray();
        res.send(result)
    })

    app.patch("/users/admin/:id", async (req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const updateDoc = {
          $set: {
            role: "admin"
          },
        }
        const result = await usersCollection.updateOne(query, updateDoc);
        res.send(result);
    })
    app.patch("/users/:id", async(req, res) => {
      console.log("req.body", req.body)
      const {name, location, contact, gender, image} = req.body;
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          name, image, contact, location, gender
        },
      }
      console.log(updateDoc)
      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    })
    // app.post("/users", async(req, res) => {
    //   console.log("req.body", req.body)
    //   const params = req.body;
    //   const result = await usersCollection.insertOne(params);
    //   res.send(result);
    // })
    // app.get("/users", async(req, res) => {
    //   const result = await usersCollection.find().toArray()
    //   res.send(result);
    // })

    app.delete("/users/admin/:id", async(req, res) => {
       const id = req.params.id;
       const query = {_id: new ObjectId(id)};
       const result = await usersCollection.deleteOne(query);
       res.send(result);
    })

    app.get("/users/admin/:email",  async(req, res) =>{
      const email = req.params.email;
      console.log(email)
      const query = {email: email} 
      console.log(query)
      const user = await usersCollection.findOne(query);
      const result = {admin: user?.role === 'admin'}
      res.send(result);
    })

    //verifyAdmin
    const verifyAdmin = async(req, res, next) => {
      const email = req.decoded.email;
      console.log(req.decoded)
      const query = {email: email}
      console.log("email", query);
      const user = await usersCollection.findOne(query);
      if(user?.role !== "admin") {
        return res.status(403).send({ error: true, message: "UNauthorized access"})
      }
      next()
    }
    

    //products
    app.get("/products",  async(req, res) => {
      const result = await productsCollection.find().toArray()
      res.send(result)
    })

   
    app.post("/products", async(req, res) =>{
      const params = req.body;
      console.log(params);
      const result = await productsCollection.insertOne(params);
      res.send(result);
    })
    app.post("/uploadImage", upload.array('image', 3), async(req, res) => {
      const result = req.file;
      console.log(req.file);
      res.send( result);
    })
    // app.get("/products/:id", async(req, res) => {
    //   const id = req.params.id;
    //   const query = {_id: new ObjectId(id)};
    //   console.log(query);
    //   const result = await productsCollection.findOne(query)
    //   res.send(result)
    // })

    app.get("/products/category/:category", async(req, res) => {
      const category = req.params.category;
      const query = {category: category};
      console.log(query)
      const result = await productsCollection.find(query).toArray()
      console.log(result)
      res.send(result);
    })

    app.get("/products/id/:id", async(req, res) => {
      console.log("req:", req)
      const id = req.params.id;
      const query= {_id: new ObjectId(id)};
      const result = await productsCollection.findOne(query)
      res.send(result);
    })

    
// app.get("/products/id/:id", async (req, res) => {
//   const id = req.params.id;

//   if (!ObjectId.isValid(id)) {
//      return res.status(400).json({ error: 'Invalid ObjectId' });
//   }

//   const query = { _id: new ObjectId(id) };
//   console.log(id, query);

//   const result = await productsCollection.findOne(query);
//   res.send(result);
// });

    //carts

    app.post("/carts", async(req, res) => {
      const product = req.body;
      const result = await cartsCollection.insertOne(product)
      res.send(result);
    })

    app.get("/carts", async(req, res) => {
      const email = req.query.email;
      if (!email){
        res.send([])
      }
      const query = {email:email};
      const result = await cartsCollection.find(query).toArray()
      res.send(result);

    })

    app.get("/cartsAll", async(req, res) => {
      const result = await cartsCollection.find().toArray()
      res.send(result);
    })

    app.delete("/cartsAll/:id", async(req, res) => {
      console.log(req)
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      console.log('query', query);
      const result = await cartsCollection.deleteOne(query);
      res.send(result);
    })

    //searching 

    app.get("/search/:category", async(req, res) => {
      //for only search by category:
      const category = req.params.category;
     const regex = new RegExp(category, 'i')
      const result = await productsCollection.find({category: { $regex: regex }}).toArray();
      res.send(result);
    })

    //review

    app.post("/review", async(req, res)=> {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review)
      res.send(result);
    })
    // app.get("/search/:name", async(req, res) => {
    //   //for only search by category:
    //   const name = req.params.name;
    //  const regex = new RegExp(name, 'i')
    //   const result = await productsCollection.find({name: { $regex: regex }}).toArray();
    //   res.json(result);
    // })
      //search for both category and name:
      // const query = req.params.query;
      // const result = await productsCollection.find({
      //   $or: [
      //     {category: {$regex: new RegExp(query, 'i')}},
      //     {name: {$regex: new RegExp(query, 'i')}}
      //   ]
      // }).toArray();
      //app.get("/search/:category", async(req, res) => {
    //   const query = req.params.query;
    //   // const name = {name: query};
    //   // const category = {category: query};
    //   const nameRegex = new RegExp(query, 'i')
    //   const categoryRegex = new RegExp(query, 'i')
    //   //const name = new RegExp(name ,'i' )
    //   const result = await productsCollection.find({
    //     $or: [
    //       {category: { $regex: categoryRegex }},
    //       {name: { $regex: nameRegex }}
    //     ]
    //   }).toArray();
    //   console.log("query:", query)
    //   console.log("search query:" , nameRegex, categoryRegex)
    //   console.log("result:", result)
    //   res.json(result);
    // })

    //payment gatway by stripe

    app.post('/create-payment-intent', verifyJWT, async(req, res)=>{
      const {price} = req.body;
      const amount = price * 100;
      console.log('price, amount', price, amount)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      })
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })

    app.get('/carts/myPayment/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await cartsCollection.findOne(query);
      console.log(result);
      res.send(result);
    })
 
    app.post('/payments/:id', async(req, res) =>{
      const id = req.params.id;
      const payment = req.body;
      const insertResult = await paymentsCollection.insertOne(payment)
      console.log(insertResult);

      await cartsCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: {status: 'payment_completed',
         payment_date: new Date()}}
      );
      res.send(insertResult)
    })

    app.get('/payments/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await paymentsCollection.findOne(query);
      res.send(result);
    })

    app.get('/allPayments', async(req, res) =>{
      const result = await paymentsCollection.find().toArray();
      res.send(result);
    })

    app.delete('/allPayments/:id',async(req, res) =>{
      console.log(req)
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await paymentsCollection.deleteOne(query)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}

  
run().catch(console.dir);


app.listen(port, () => {
    console.log(`emarse is running on port ${port}`)
})

//mongodb://localhost:27017