const assert = require("assert");
const ganache = require("ganache-cli");
const { beforeEach } = require("mocha");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());
const compiledFactory = require("../ethereum/build/CampaignFactory.json");
const compiledCampaign = require("../ethereum/build/Campaign.json");

let accounts;
let factory;
let campaignAddress;
let campaign;



beforeEach(async()=>{
    accounts = await web3.eth.getAccounts();
    factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
     .deploy({data : compiledFactory.bytecode})
     .send({
      from:accounts[0],
      gas : "1000000"
     })

     await factory.methods.createCampaign("100").send({
        from : accounts[0], // accounts[0] will be the manager
        gas : "1000000"
     })

     const addresses = await factory.methods.getDeployedCampaigns().call();
     campaignAddress = addresses[0]; // address where the campaign deployed


     // THe campaign is already deployed when we called the createContract() 
    //  function in the factory so we have to specify its address to communicate with it through web3
     campaign = await new web3.eth.Contract(JSON.parse(compiledCampaign.interface),campaignAddress)

    
})

describe("Campaign",()=>{
   it("Deploys a factory and a campaign",()=>{
      assert.ok(factory.options.address);
      assert.ok(campaign.options.address)
   })

   it("marks caller as the manager",async()=>{
      const manager = await campaign.methods.manager().call();

      assert.equal(manager,accounts[0]);
   })

   it("allows people to contribute and marks them as approvers", async()=>{
      await campaign.methods.contribute().send({
         value : "200", // minimum contribution is 100 
         from : accounts[1]
      });

      const isContributer = await campaign.methods.approvers(accounts[1]).call();
      
      assert(isContributer);

   }
   )

   it("requires minimum contribution", async()=>{

      let executed;

      try{
         await campaign.methods.contribute().send({
            value : "10",
            from : accounts[1]
         });

         executed = "pass" // assert throws error in try block which will eventually catched by the catch block 

         
         
      }
      catch(err){
         
         executed = "fail"
      }

      assert.equal("fail",executed);
      
   })

   it("allows a manger to make a payment request", async()=>{
      await campaign.methods.createRequest("to buy batteries","1000",accounts[1]).send({
         from:accounts[0],
         gas : "1000000"
      })

      const request = await campaign.methods.requests(0).call();

      assert.equal("to buy batteries",request.description)
   })

   it("processes request", async()=>{

      let initialBalance = await web3.eth.getBalance(accounts[1]);
      initialBalance = web3.utils.fromWei(initialBalance, "ether");
      initialBalance = parseFloat(initialBalance);

      console.log(initialBalance);

      await campaign.methods.contribute().send({ // contributes to the contract
         from : accounts[0],
         value: web3.utils.toWei("10", "ether")
      });

      await campaign.methods
      .createRequest("a", web3.utils.toWei("5","ether"),accounts[1]).send({
         from : accounts[0],
         gas : "1000000"  // Creates the request
      });

      await campaign.methods.approveRequest(0).send({
         from: accounts[0],
         gas : "1000000"
      });

      await campaign.methods.finalizeRequest(0).send({
         from: accounts[0],
         gas: "1000000"
      })

      let balance = await web3.eth.getBalance(accounts[1]); // gets balance at accounts[1]
      balance = web3.utils.fromWei(balance,"ether");
      balance = parseFloat(balance) // converts balance from string to decimal value

      console.log(balance);

      assert(balance > initialBalance);

   })

})