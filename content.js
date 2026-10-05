/* Assigned COMPAS readings. Private facilitation guidance belongs in the PDF, not this file. */
window.LAB_CONTENT={
 version:'4.0',
 // Stage 10 is the new briefing; original response stages retain their IDs.
 order:[0,10,1,2,3,4,5,6,7,8,9],
 names:['Lobby','Opening vote','Fairness face-off','Stakeholder discussion','Race as an input','Threshold lab','Beyond equal errors','Who decides?','Team principles','Final vote','Case background'],
 stakeholders:{scientists:'Data scientists',vendor:'COMPAS vendor',judges:'Judges',legislators:'Legislators',defendants:'Defendants',communities:'Affected communities'},
 principles:{accuracy:'Accuracy and calibration',subgroups:'Subgroup error monitoring',transparency:'Transparency and explanations',appeal:'Ability to contest decisions',human:'Meaningful human review',purpose:'Clear limits on use',labels:'Audit the target and labels',monitoring:'Ongoing deployment monitoring'},
 trust:{algorithm:'Algorithmic assessment (COMPAS)',judge:'A human judge',safeguards:'Neither without specified safeguards',unsure:'Not enough information'},
 activities:{
 10:{key:'background',title:'COMPAS: the case in context',kind:'briefing'},
 1:{key:'initial',title:'Who would you trust with this decision?',question:'If you were awaiting trial, would you rather have your risk assessed by COMPAS or by a human judge?',kind:'poll',follow:'What would you need to know about each before deciding?'},
 2:{key:'fairness',title:'Same evidence. Different fairness questions.',question:'Which fairness criterion would you prioritize for this use, and why?',kind:'poll',options:{errors:'Equalize error rates',calibration:'Preserve the meaning of risk scores',context:'The choice depends on the decision context',unsure:'I need more information'},follow:'What did ProPublica call unfair? What did Northpointe defend as fair? If both statistics are correct, what is the disagreement about?'},
 3:{key:'breakout',title:'A stakeholder roundtable',question:'From your assigned perspective, which concern would you prioritize, what trade-off would you accept, and who would bear its cost?',kind:'discussion',follow:'Each group: give one principle, one cost, and one safeguard in 30 seconds.'},
 4:{key:'race',title:'What does "we do not use race" establish?',question:'If removing race as an input does not remove disparities, how much assurance does that claim provide?',kind:'poll',options:{enough:'Enough assurance for this use',limited:'A useful constraint, but insufficient evidence of fairness',insufficient:'Little assurance without examining the data and outcomes',unsure:'I need more information'},follow:'Where else might disparities enter: labels, proxies, sampling, thresholds, or deployment?'},
 5:{key:'threshold',title:'What changes when the stakes change?',question:'Choose a threshold, inspect the resulting errors, then submit your choice.',kind:'threshold',follow:'Who bears each error? Would you keep the same threshold if the consequence changed?'},
 6:{key:'equal',title:'Equal errors. Is the decision settled?',question:'Imagine a system has equal false-positive and false-negative rates across the racial groups audited. Would that be enough to justify using it to help decide pretrial detention?',kind:'poll',options:{yes:'Yes, that would address my main concern',no:'No, other concerns would remain',depends:'It depends on other safeguards and evidence',unsure:'I am not sure'},follow:'Should predicted future risk affect liberty before trial? What concern remains, and could any of our mathematical metrics detect it?'},
 7:{key:'tokens',title:'Who should choose the fairness standard?',question:'Allocate exactly 10 influence tokens across these six stakeholders.',kind:'tokens',follow:'Who effectively selected the standards in the original COMPAS debate? Who should participate in selecting them?'},
 8:{key:'principles',title:'Your team\'s non-negotiables',question:'Choose two or three principles for a team developing, evaluating, or deploying a tool like COMPAS.',kind:'principles',follow:'What about this case makes each principle important? Name a concrete action your team would take.'},
 9:{key:'final',title:'Revisit your starting point',question:'After the discussion, would you rather have your risk assessed by COMPAS or by a human judge?',kind:'poll',follow:'Did your answer change? Which evidence or condition mattered? Name a concern that no fairness metric alone could resolve.'}
 },
 background:{
  subtitle:'A historical case about risk assessment, competing fairness criteria, and decisions about liberty.',
  cards:[
   {title:'What is COMPAS?',text:'Correctional Offender Management Profiling for Alternative Sanctions is Northpointe\'s risk-and-needs assessment tool. It produces risk scores; it is not a human judge.',refs:[1]},
   {title:'What was investigated?',text:'The 2016 investigation studied Broward County defendants scored in 2013-2014, comparing scores with recorded outcomes over the following two years.',refs:[1]},
   {title:'Why does the score matter?',text:'Risk assessments can inform decisions about release, supervision, or sentencing. This classroom focuses on a hypothetical pretrial use: a person is awaiting trial, not receiving punishment for a predicted future act.',refs:[1,4]},
   {title:'What is the observed outcome?',text:'The readings examine recorded recidivism, including rearrest or new charges. A recorded rearrest is not the same thing as all criminal behavior or a finding of guilt.',refs:[1,4]}
  ],
  terms:[
   ['Risk score','A model output used to assess risk, not a certainty about a person.'],
   ['Threshold','The cutoff that converts a score into a higher-risk or lower-risk label.'],
   ['False positive (FP)','Higher-risk label, but no recorded positive outcome in the evaluation period.'],
   ['False negative (FN)','Lower-risk label, but a recorded positive outcome in that period.'],
   ['Calibration','Compare observed outcomes among people assigned the same score.'],
   ['Base rate','The proportion with the recorded outcome in a specified group and dataset.']
  ],
  framing:'The class will compare what each fairness criterion measures, then discuss what should follow from it. No opinion poll has a model answer.'
 },
 // These are source summaries, not answers to the normative poll choices.
 readingEvidence:{
 2:{scope:'Reading questions 1-2: the reported disagreement',blocks:[
   {title:'ProPublica: distribution of errors',text:'Reported Black/White false-positive rates were 44.9%/23.5%; false-negative rates were 28.0%/47.7%. The concern was who bore each type of error.',refs:[1]},
   {title:'Northpointe: interpretation of scores',text:'The defense emphasized comparable predictive meaning across groups. Feller et al. examine calibration: people at the same score had approximately similar observed outcome rates.',refs:[3]},
   {title:'Why both claims can hold',text:'Error rates condition on observed outcomes; calibration conditions on scores. The follow-up readings explain tensions between fairness criteria when outcome base rates differ. Choosing which criterion matters is not settled by these statistics.',refs:[2,3]}
  ],boundary:'These sources explain the dispute. They do not make one fairness criterion the correct answer to this poll.'},
 4:{scope:'Reading question 4: what the input claim does and does not establish',blocks:[
   {title:'An input statement is not an outcome guarantee',text:'The readings report that race was not an explicit COMPAS input, yet group error rates differed. Hao and Stray also discuss the limits of using arrest records as a proxy for crime. The absence of a race field does not itself establish equal outcomes or errors.',refs:[1,4]}
  ],boundary:'The sources do not show that every correlated variable is inappropriate or identify the cause of every observed disparity.'},
 5:{scope:'Technical background only: changing a cutoff',blocks:[
   {title:'What the slider changes',text:'With scores and recorded outcomes fixed, raising the cutoff labels fewer cases higher risk: false positives cannot increase, while false negatives cannot decrease. Lowering it reverses that trade-off. The classroom counts are synthetic, not COMPAS records.',refs:[4]},
   {title:'What it does not decide',text:'A different threshold changes the decision rule. It does not by itself change the calibration of the underlying scores. Neither the slider nor its class average determines the appropriate consequence or an ethically correct cutoff.',refs:[3,4]}
  ],boundary:'No reading-based answer is provided for which threshold you should choose or whether prediction should affect liberty.'},
 7:{scope:'Reading question 7: the descriptive part only',blocks:[
   {title:'Who used which standard?',text:'In the debate, ProPublica evaluated error disparities; Northpointe defended predictive validity and score meaning. Hao and Stray emphasize that people choose thresholds and how risk assessments are used. These are distinct evaluative and deployment choices, not a single collective decision.',refs:[1,3,4]}
  ],boundary:'Who SHOULD have authority is an open discussion question. The readings do not supply a required token allocation.'}
 },
 roles:[
 {name:'A - Defendants and civil-rights advocates',prompt:'Consider false positives, access to explanations, and the ability to challenge a score. What else matters from this perspective?'},
 {name:'B - Model developers',prompt:'Consider predictive validity, score interpretation, and deployment limits. What trade-offs should developers disclose?'},
 {name:'C - Judges and public-safety officials',prompt:'Consider both missed risks and unnecessary restrictions. What evidence should a judge require beyond a score?'},
 {name:'D - Community representatives',prompt:'Consider who chooses the goal, who bears the effects, and whether prediction is appropriate for this decision at all.'}
 ],
 sources:[
 ['R1 - ProPublica: Machine Bias (2016)','https://www.propublica.org/article/machine-bias-risk-assessments-in-criminal-sentencing'],
 ['R2 - ProPublica: Mathematical trade-offs (2016)','https://www.propublica.org/article/bias-in-criminal-risk-scores-is-mathematically-inevitable-researchers-say'],
 ['R3 - Feller et al.: Washington Post analysis (2016)','https://perma.cc/KYC8-KYGD'],
 ['R4 - Hao and Stray: Courtroom algorithm game (2019)','https://www.technologyreview.com/2019/10/17/75285/ai-fairer-than-judge-criminal-risk-assessment-algorithm/']
 ]
};
LAB_CONTENT.activities[1].options=LAB_CONTENT.trust;
LAB_CONTENT.activities[9].options=LAB_CONTENT.trust;
