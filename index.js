const express = require('express')
const app = express()
const cors = require ('cors')
const port = process.env.PORT || 5000
require('dotenv').config()
const { MongoClient, ServerApiVersion ,  ObjectId} = require('mongodb');


app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.du8ko.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const userCollection = client.db('taskDb').collection('user')
    const taskCollection = client.db('taskDb').collection('task')


    // user related apis


    app.post('/users' , async(req , res) =>{
      const user = req.body
      const query = {email : user.email}
      const existingUser = await userCollection.findOne(query)
      if(existingUser){
        return res.send({messege : 'user already exist'})
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
      
      
          })


 app.get('/users' ,async(req , res) =>{
  const email = req.query.email
  const query ={ email }
    const result = await userCollection.find(query).toArray()
  res.send(result)    
              

  })







  // task added apis


  app.post('/tasks' , async(req , res) =>{
    const user = req.body
    const result = await taskCollection.insertOne(user)
    res.send(result)
    
    
        })

  app.get('/tasks' ,async(req , res) =>{
    const email = req.query.email
    const query ={email :email}
    const result = await taskCollection.find(query).toArray()
    res.send(result)
})


app.delete('/tasks/:id', async(req , res) =>{
  const id = req.params.id
  const query ={ _id : new ObjectId(id)}

  const result = await taskCollection.deleteOne(query)
  res.send(result)
})


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req , res) =>{
  res.send('Taskpeks is running ')
})
app.listen(port, () => {
  console.log(`Taskperks is running from port ${port}`)
})
