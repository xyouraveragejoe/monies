import {uid} from './format.js';

/* ── defaults ── */

export const D_PROFILE={age:28,country:'US',currency:'USD',retireAge:60,lifeExpect:85,name:'',dependents:0};

export const D_INCOME={salary:5000,bonus:500,sideIncome:200,otherIncome:0,payFreq:'monthly'};

export const D_EXPENSES={housing:1200,utilities:150,groceries:400,diningOut:200,transport:200,fuel:100,coffee:50,insurance_health:150,insurance_life:50,insurance_car:100,insurance_home:80,childcare:0,education:0,clothing:100,entertainment:100,subscriptions:50,gym:50,travel:100,medical:50,personalCare:80,gifts:50,charity:50,parentAllowance:0,roadTax:20,miscellaneous:100};

export const D_ASSETS=[{id:uid(),name:'Checking Account',type:'cash',value:5000,institution:'Chase',notes:''},{id:uid(),name:'Savings Account',type:'cash',value:15000,institution:'Chase',notes:''},{id:uid(),name:'401(k)',type:'retirement',value:30000,institution:'Fidelity',notes:''},{id:uid(),name:'Stock Portfolio',type:'investment',value:20000,institution:'Robinhood',notes:''}];

export const D_DEBTS={creditCards:[{id:uid(),name:'Visa Credit Card',balance:3000,rate:19.9,minPayment:60,limit:5000}],loans:[{id:uid(),name:'Car Loan',balance:15000,rate:5.5,minPayment:280,tenureMonths:48}],mortgage:{balance:0,rate:3.5,minPayment:0,tenureMonths:360,propertyValue:0}};

export const D_RETIREMENT={desiredAge:60,desiredIncome:60000,lifestyle:'comfortable',inflation:3,returnRate:7,monthlyContrib:500};

export const D_PREDICTOR={desiredIncome:50000,monthlyInvest:500,riskLevel:'moderate'};

export const D_GOALS=[{id:uid(),label:'Emergency Fund',category:'savings',targetAge:30,targetAmount:15000,currentAmount:5000,done:false,color:'#c98a2b',note:'6 months of expenses'},{id:uid(),label:'Buy a House',category:'property',targetAge:35,targetAmount:80000,currentAmount:0,done:false,color:'#4a7c52',note:'20% down payment'},{id:uid(),label:'Early Retirement (FIRE)',category:'retirement',targetAge:55,targetAmount:1500000,currentAmount:50000,done:false,color:'#7a5a3a',note:'FIRE target'}];

export const D_SCENARIOS=[{id:uid(),name:'Buy a House',icon:'🏠',enabled:false,category:'property',cost:400000,downPayment:80000,loanAmount:320000,loanRate:4.5,loanTenure:360,monthlyExtra:200,prepYears:3,risk:'medium',note:'Including maintenance & property tax'},{id:uid(),name:'Start a Business',icon:'🚀',enabled:false,category:'business',cost:50000,downPayment:50000,loanAmount:0,loanRate:0,loanTenure:0,monthlyExtra:-500,prepYears:2,risk:'high',note:'Initial capital + operating costs'},{id:uid(),name:'Have Children',icon:'👶',enabled:false,category:'family',cost:15000,downPayment:0,loanAmount:0,loanRate:0,loanTenure:0,monthlyExtra:1200,prepYears:1,risk:'low',note:'Estimated yearly cost per child'},{id:uid(),name:'Move Country',icon:'✈️',enabled:false,category:'lifestyle',cost:20000,downPayment:20000,loanAmount:0,loanRate:0,loanTenure:0,monthlyExtra:0,prepYears:2,risk:'medium',note:'Relocation + visa + setup costs'}];

export const D_AI={apiKey:'',messages:[],reportGenerated:false,report:''};

export const D_LIFESTYLE={template:'balanced',travelOften:false,luxuryCar:false,bigFamily:false,privateSchool:false,businessClass:false,beachHouse:false,entrepreneurLife:false,digitalNomad:false};

/* ── icon helpers ── */

export const ASSET_ICONS={cash:'💵',investment:'📈',retirement:'🏦',property:'🏠',crypto:'₿',other:'📦'};

export const ASSET_COLORS={cash:'#d9a22b',investment:'#4a7c52',retirement:'#c98a2b',property:'#6b8fa3',crypto:'#a86f8c',other:'#8a917f'};

export const DEBT_RISK_COLOR={low:'var(--accent2)',medium:'var(--amber)',high:'var(--red)'};
