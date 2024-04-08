const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const xlsx = require('xlsx');
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL;
const MONGO_URL = process.env.MONGO_URL;

const Agent = require('./model/Agent');
const Category = require('./model/PolicyCategory');
const Company = require('./model/PolicyCarrier');
const Account = require('./model/Account');
const User = require('./model/User');
const Policy = require('./model/PolicyInfo');

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', BASE_URL);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

app.use(cors({credentials:true, origin: `${BASE_URL}`}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));
  
mongoose.connect(`${MONGO_URL}`);

app.post('/upload', upload.single('file'), async (req, res) => {
    console.log("Uploading data to Database...");
    
    const worker = new Worker('./worker.js', { workerData: req.file.path });

    worker.on('message', async (data) => {
        try {
            await processData(data);
            res.status(200).json({ message: "Data uploaded successfully!" });
        } catch (err) {
            console.log("Error while saving to DB");
            res.status(500).json({ error: "Error while saving data to DB" });
        }
    });

    worker.on('error', (err) => {
        console.error(err);
        res.status(500).json({ error: "Error while processing data" });
    });

    worker.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Worker stopped with exit code ${code}`);
            res.status(500).json({ error: "Worker stopped unexpectedly" });
        }
    });
});

async function processData(data) {
    for (const entry of data) {
        const existingAgent = await Agent.findOne({ agent: entry.agent });
        if (!existingAgent) {
            await Agent.create({ agent: entry.agent });
        }
        const existingCategory = await Category.findOne({ categoryName: entry.category_name });
        if (!existingCategory) {
            await Category.create({ categoryName: entry.category_name });
        }
        const existingCompany = await Company.findOne({ companyName: entry.company_name });
        if (!existingCompany) {
            await Company.create({ companyName: entry.company_name });
        }
        const existingAccount = await Account.findOne({ accountName: entry.account_name });
        if (!existingAccount) {
            await Account.create({ accountName: entry.account_name });
        }
            
        await User.create({ firstName: entry.firstname, dob: entry.dob, address: entry.address, phoneNumber: entry.phone, state: entry.state, city: entry.city, zip: entry.zip, email: entry.email, userType: entry.userType });

        let agentId = await Agent.findOne({ agent: entry.agent });
        let userId = await User.findOne({ email: entry.email });
        let accountId = await Account.findOne({ accountName: entry.account_name });
        let categoryId = await Category.findOne({ categoryName: entry.category_name });
        let companyId = await Company.findOne({ companyName: entry.company_name });
        
        const policyCategory = [];
        let policyDetails = {
            agentId: agentId._id,
            userId: userId._id,
            accountId: accountId._id,
            categoryId: categoryId._id,
            companyId: companyId._id
        };

        policyCategory.push(policyDetails);
        await Policy.create({ policyNumber: entry.policy_number, policyStartDate: entry.policy_start_date, policyEndDate: entry.policy_end_date, policyType: entry.policy_type, policyMode: entry.policy_mode, premiumAmount: entry.premium_amount, csr: entry.csr, policyCategory: policyCategory});
    }
}

app.get('/search/:userName', async (req,res) => {
    try{
        const {userName} = req.params;
        const getUserId = await User.findOne({ firstName: userName });
        const policyDetails = await Policy.findOne({ 'policyCategory.userId': getUserId._id });
        const policyData = [];

        let agentData = await Agent.findOne({ _id: policyDetails.policyCategory[0].agentId });
        let userData = await User.findOne({ _id: policyDetails.policyCategory[0].userId });
        let accountData = await Account.findOne({ _id: policyDetails.policyCategory[0].accountId });
        let categoryData = await Category.findOne({ _id: policyDetails.policyCategory[0].categoryId });
        let companyData = await Company.findOne({ _id: policyDetails.policyCategory[0].companyId });

        const policyObj = {
            policyNumber: policyDetails.policyNumber,
            policyStartDate: policyDetails.policyStartDate,
            policyEndDate: policyDetails.policyEndDate,
            policyType: policyDetails.policyType,
            policyMode: policyDetails.policyMode,
            premiumAmount: policyDetails.premiumAmount,
            csr: policyDetails.csr,
            agent: agentData.agent,
            userDetails: {firstName: userData.firstName, dob: userData.dob, address: userData.address, phoneNumber: userData.phoneNumber, state: userData.state, city: userData.city, zip: userData.zip, email: userData.email, userType: userData.userType},
            accountName: accountData.accountName,
            category: categoryData.categoryName,
            company: companyData.companyName,
        }
        policyData.push(policyObj);
        res.status(200).json(policyData);
    }catch(err){
        console.log("Error while Searching userName");
        res.status(500).json({ error: "Error while Searching userName" });
    }
});

app.get('/user-policies/:email', async(req,res)=>{
    try{
        const { email } = req.params;
        console.log("email==>", email)
        const user = await User.findOne({ 'email': email });
        console.log("user==>", user)
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const policies = await Policy.find({ 'policyCategory.userId': user._id });
        const aggregatedPolicies = [];
        for (const policy of policies) {
            const agentData = await Agent.findOne({ _id: policy.policyCategory[0].agentId });
            const accountData = await Account.findOne({ _id: policy.policyCategory[0].accountId });
            const categoryData = await Category.findOne({ _id: policy.policyCategory[0].categoryId });
            const companyData = await Company.findOne({ _id: policy.policyCategory[0].companyId });

            const policyObj = {
                policyNumber: policy.policyNumber,
                policyStartDate: policy.policyStartDate,
                policyEndDate: policy.policyEndDate,
                policyType: policy.policyType,
                policyMode: policy.policyMode,
                premiumAmount: policy.premiumAmount,
                csr: policy.csr,
                agent: agentData.agent,
                accountName: accountData.accountName,
                category: categoryData.categoryName,
                company: companyData.companyName,
            };
            aggregatedPolicies.push(policyObj);
        }
        res.status(200).json(aggregatedPolicies);
    }catch(err){
        console.error("Error while retrieving aggregated policy information by user email:", err);
        res.status(500).json({ error: "Internal server error" });
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});