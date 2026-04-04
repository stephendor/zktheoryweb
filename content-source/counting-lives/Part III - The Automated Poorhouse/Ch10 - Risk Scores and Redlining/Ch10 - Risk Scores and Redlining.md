---
type: chapter
part: III
number: 10
status: outline
word-count-target: 30000

core-regime: "The Automated Poorhouse"
mathematical-tools: ["eligibility thresholds", "risk scores", "logistic regression classifiers", "fraud probability scores", "means-testing algorithms", "conditionality decision trees"]
related-MM: "MM-Interlude-C - From Scales to Scores: Eligibility, Risk, and Classification"

main-figures: ["Iain Duncan Smith", "Virginia Eubanks", "Suresh Naidu", "Jason Turner", "Daniel Patrick Moynihan (legacy)", "Timnit Gebru"]
main-institutions: ["DWP – Universal Credit", "HMRC RTI System", "Indiana FSSA / IBM", "Michigan MIDAS", "Centrelink – Australia", "US Social Security Administration"]
key-theorists: ["Eubanks", "Noble", "Benjamin", "Porter", "Scott"]

spine-role: "Part III – opening / empirical foundation"
tags: [chapter, part-III, universal-credit, algorithmic-welfare, risk-scores, redlining, UC, SNAP, TANF]
---

# Ch10 – Risk Scores and Redlining: Algorithmic Welfare in the US and UK

## Core Claim
The automated welfare systems of the early twenty-first century are not a technological break from the traditions this book has traced — they are their densest crystallisation. The eligibility thresholds are Orshansky's matrices, stripped of their material grounding and re-encoded as decision-tree classifiers. The fraud-risk scores are RAND's objective functions, now running in real time on claimant data. The conditionality algorithms are the Skinnerian feedback loop of Ch5, automated at scale. And the whole infrastructure was funded, designed, and in many cases operated by the VC-backed companies of Ch9. What is new is not the logic but the speed, the opacity, and the near-impossibility of appeal. This chapter brings the arithmetic of power down from the server room to the kitchen table.

## Place in the Spine
- Opens: [[Part III - The Automated Poorhouse]]
- Builds directly on: [[MM-Interlude-C - From Scales to Scores]]
- Connects back to: [[Ch01 - The Statistician's Stomach]] — Orshansky's thresholds as the ancestor of UC standard allowances
- Connects back to: [[Ch03 - From Poor Law to Social Insurance]] — Beveridge's actuarial model as the structural origin of UC's design
- Connects back to: [[Ch06 - The RAND Corporation's Poor]] — objective-function welfare logic now automated
- Connects back to: [[Ch09 - Venture Capital's Ledger]] — the companies that built these systems
- Sets up: [[Ch11 - Palantir's Panopticon]] — welfare data integration into policing

## Mathematical Tools in Play
- Tool(s): Logistic regression classifiers for fraud detection; eligibility decision trees (means tests encoded as conditional logic); risk-banding of claimants by predicted non-compliance; real-time earnings data matching (HMRC RTI); sanctions probability modelling; algorithmic "claimant commitment" compliance scoring
- Governance function: Automates the gatekeeping function of welfare — deciding who receives, who is suspected, and who is sanctioned — at a scale and speed that forecloses meaningful human review. The threshold, the score, and the flag are no longer contestable in the way Orshansky's matrices were; they are proprietary, opaque, and presented as objective outputs rather than political choices.
- Related MM: [[MM-Interlude-C - From Scales to Scores]]

## Key Scenes / Narrative Beats
- [ ] Opening: A Universal Credit claimant in a Weymouth Job Centre Plus, 2019 — the adviser reads from a screen that has already made a decision; the algorithm's reasoning is not available to either of them; the five-week wait has begun
- [ ] The Indiana Disaster: IBM's 2006 contract to automate Indiana's welfare eligibility system; 1.16 million wrongful denials in three years; the algorithm's error rate is higher than the human system it replaced; IBM is paid $1.37 billion and the contract is eventually cancelled — the claimants receive nothing
- [ ] MiDAS Michigan: The Michigan Integrated Data Automated System (2013–2016) automatically flags claimants for unemployment fraud; 40,000 false fraud accusations in 18 months; many recipients are bankrupted by automatic repayment demands before any human review occurs
- [ ] Australian Robodebt: The Australian Department of Human Services' income-averaging algorithm (2016–2019) generates 470,000 false debt notices by comparing annual tax data with fortnightly benefit claims; at least two suicides are directly linked; the scheme is eventually ruled unlawful — but only after three years of operation
- [ ] UC's Standard Allowances and the Ghost of Orshansky: a close reading of how Universal Credit's standard allowances are set — not from a material assessment of what households need (Orshansky's method) but from a political decision about work incentives and fiscal targets, with the mathematics applied post-hoc to justify the figure
- [ ] Contemporary Echo: DWP's 2024 "Targeted Case Review" — algorithmic scanning of 2.3 million legacy benefit claimants for potential fraud; the political and mathematical logic of the system directly continuous with everything this chapter traces

## Theoretical Anchors
- [[Eubanks - Automating Inequality]]: the primary empirical reference; her three case studies (Indiana, Allegheny, Los Angeles) provide the granular evidence base for the chapter's argument; this chapter extends her framework to the UK
- [[Noble - Algorithms of Oppression]]: the racialised encoding of welfare risk scores; how historical redlining, discriminatory employment data, and criminalisation patterns are absorbed into training data and reproduced by classifiers
- [[Benjamin - Race After Technology]]: the "New Jim Code" — discriminatory outcomes laundered through algorithmic neutrality; the welfare system as an automated reproduction of prior structural disadvantage
- [[Scott - Seeing Like a State]]: the welfare claimant becomes legible only as a data point in a compliance model; lived complexity is reduced to a feature vector
- [[Porter - Trust in Numbers]]: the algorithm's output is presented as objective; the political choices embedded in its design — threshold levels, feature selection, training data — are invisible to the claimant and often to the administrator

## Case Material
- People: [[Iain Duncan Smith]], [[Virginia Eubanks]], [[Timnit Gebru]], [[Frances Ryan]], [[Kwame Anthony Appiah (algorithmic justice)]]
- Institutions: [[DWP – Universal Credit]], [[HMRC Real-Time Information System]], [[Indiana FSSA / IBM contract]], [[Michigan MIDAS]], [[Centrelink Australia – Robodebt]], [[Allegheny Family Screening Tool]], [[Scottish Social Security]], [[Child Poverty Action Group]]
- Regimes / Systems: [[UC – Standard Allowances (technical detail)]], [[UC – Claimant Commitment and Sanctions]], [[DWP Targeted Case Review 2024]], [[Indiana Welfare Modernisation – IBM]], [[Michigan MIDAS fraud detection]], [[Australian Robodebt scheme]], [[SNAP eligibility algorithm (US)]], [[TANF work requirement compliance systems]]

## Argument in Sections

### 1. The Threshold Encoded: From Orshansky's Matrices to Decision Trees
Orshansky's 124 household thresholds were material, specific, contestable, and publicly documented — they could be challenged by pointing at a grocery receipt. Universal Credit's standard allowances are set by a political process that begins with a fiscal target and works backwards to justify a number, then encoded as a database constant inside a proprietary system. The mathematical form is superficially similar — a threshold below which a household is eligible — but the epistemological relationship to material need is inverted. Where Orshansky's line asked "what does this household actually require to survive?", UC's standard allowance asks "what level of payment is consistent with preserving work incentives at our target cost?" This section performs that comparison in detail, tracing the genealogy from Beveridge's actuarial flat-rate model through RAND's objective-function welfare to UC's digital implementation. The threshold is still doing the same governance work it always did; it is now simply harder to see.

### 2. Fraud by Algorithm: Indiana, Michigan, and the Presumption of Guilt
The shift from fraud detection to fraud presumption is the central mathematical move this section examines. Earlier welfare systems assumed eligibility and investigated anomalies; algorithmic systems invert this — they generate a fraud-probability score for every claimant and require the claimant to disprove a machine's suspicion. The Indiana IBM disaster (2006–2009) and the Michigan MiDAS system (2013–2016) are the clearest case studies: both deployed logistic regression classifiers trained on historical fraud cases, both generated false positive rates dramatically higher than their human predecessors, and both imposed the costs of their errors entirely on claimants rather than administrators. The mathematical reason for the failure is instructive: training data drawn from historical fraud investigations over-represents populations that were historically over-investigated — Black, urban, single-parent households — so the classifier reproduces the prior discrimination as a probability score. Noble's "algorithms of oppression" and Benjamin's "New Jim Code" give this a name; this section gives it a mechanism.

### 3. Robodebt and the Arithmetic of Injustice
The Australian Robodebt scheme offers the most legally and mathematically documented case study of algorithmic welfare failure available. The scheme's core error was elementary: it compared annual tax-reported income (a single point) with fortnightly benefit payments (a time series) by assuming income was earned evenly across the year. For any claimant whose income was irregular — seasonal workers, casual employees, people who moved between work and benefits — the algorithm generated a "debt" that was a mathematical artefact of the comparison method, not a real overpayment. The scheme ran for three years, generated 470,000 debt notices, and was ruled unlawful only after a class action forced the government to release its methodology. This section uses Robodebt as a teaching case in the book's central argument: the algorithm's output was presented with the authority of mathematical precision, but the precision was false — a threshold applied to incompatible data with no human review of the underlying logic.

### 4. Universal Credit's Feedback Loop: Conditionality as Control System
Universal Credit's claimant commitment system — the contractual requirement to perform specified job-seeking activities in exchange for benefit payment, monitored by job centre advisers using a digital compliance record — is a direct implementation of the Skinnerian feedback loop described in Ch5. The target state is employment; deviations (missed appointments, insufficient job applications, non-compliance with training requirements) trigger sanctions (benefit reductions of up to 100% for up to three years); the sanction is the error-correction signal. The system's designers at DWP described it explicitly in systems-thinking language during its development. What the design omits — as all control systems must — is the material reality of the people inside the loop: the claimant with no broadband access who misses an online reporting deadline, the carer whose appointment clashes with a hospital visit, the disabled person whose compliance is assessed by criteria written for the non-disabled. The feedback loop optimises for a measured output (compliance rate, off-flow from benefits) that diverges systematically from the welfare of the people it governs.

### 5. The Redlining Parallel: Spatial and Racial Encoding in Welfare Algorithms
The chapter's title reaches for the redlining parallel deliberately. 1930s Home Owners' Loan Corporation maps colour-coded neighbourhoods by perceived mortgage risk, encoding racial composition as a financial variable; the maps were then used by banks to deny mortgages, and the denial created the decay that the maps had predicted, completing a self-fulfilling feedback loop. Algorithmic welfare systems operate by the same mechanism at scale. A UC claimant's postcode is a feature; local labour market data is a feature; prior benefit history is a feature; each of these encodes prior structural disadvantage, prior discrimination, and prior over-surveillance. The classifier trained on this data does not reproduce discrimination by accident — it reproduces it by design, because the training data is a record of prior discrimination presented as neutral history. This section traces that mechanism through the DWP's Targeted Case Review (2024), showing how the algorithm's "risk flags" cluster spatially and racially in ways that are mathematically predictable from the feature set.

### 6. Scotland as Counter-Case: What a Different Mathematical Culture Looks Like
The chapter closes with a deliberately hopeful counter-example that previews Part IV. The Scottish Social Security system, established under devolved powers in 2018, made explicit design choices that differ at every mathematical joint from the DWP model: dignity as a statutory principle, no sanctions, a presumption of entitlement rather than fraud, human decision-making at every eligibility threshold, and a consultative design process that involved claimants in defining what the system should measure. The Scottish Disability Payment application process asks what the applicant can do rather than what they cannot — a different representational scheme that produces different outcomes and different data. Scotland's system is not perfect, and its scale is limited; but it demonstrates that the mathematical choices made in UC's design were choices, not technical necessities, and that different choices produce materially different results for real people.

## Links Out
- Notes I need to create or expand:
  - [[TODO: UC Standard Allowances – legislative history and fiscal target setting]]
  - [[TODO: Indiana IBM Contract – full case record and settlement]]
  - [[TODO: Michigan MIDAS – technical report and false positive analysis]]
  - [[TODO: Robodebt – Royal Commission findings and class action record]]
  - [[TODO: DWP Targeted Case Review 2024 – methodology documentation (FOI)]]
  - [[TODO: UC Sanctions – death and hardship evidence base (CPAG, Trussell Trust)]]
  - [[TODO: Scottish Social Security – design principles and comparative outcomes]]
  - [[TODO: Allegheny Family Screening Tool – Eubanks case study detail]]
  - [[TODO: HMRC RTI – real-time earnings data matching, technical architecture]]
  - [[TODO: Redlining maps – HOLC methodology and feedback loop evidence]]
