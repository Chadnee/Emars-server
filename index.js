const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

const morgan = require('morgan');

app.use(morgan('dev'))
app.use(cors());
app.use(express.json());

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
    
    app.post('/jwt', (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
        res.send({token})
    })

    const verifyJWT = (req, res, next) => {
        const authorization = req.headers.authorization;
        if(!authorization){
            return res.status(401).send({error: true, message: 'unauthorized access'})
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
        const result = await usersCollection.insertOne(users);
        res.send(result);
    })

    app.get("/users", async(req, res) => {
        const result = await usersCollection.find().toArray();
        res.send(result)
    })
    //products
    app.get("/products", async(req, res) => {
      const result = await productsCollection.find().toArray()
      res.send(result)
    })

    // app.get("/products/:id", async(req, res) => {
    //   const id = req.params.id;
    //   const query = {_id: new ObjectId(id)};
    //   console.log(query);
    //   const result = await productsCollection.findOne(query)
    //   res.send(result)
    // })

    app.get("/products/:category", async(req, res) => {
      const category = req.params.category;
      console.log(req)
      const query = {category: category};
      console.log(query)
      const result = await productsCollection.find(query).toArray()
      console.log(result)
      res.send(result);
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