---
type: chapter
part: II
number: 8
status: outline
word-count-target: 30000

core-regime: "Ideology of optimisation"
mathematical-tools: ["expected value", "QALYs/DALYs", "temporal discount rates", "population utility functions", "cost-per-life-saved ratios", "existential risk probability estimates"]
related-MM: "MM-Interlude-C - From Scales to Scores: Eligibility, Risk, and Classification"

main-figures: ["Peter Singer", "William MacAskill", "Nick Bostrom", "Derek Parfit", "Nick Beckstead", "Sam Bankman-Fried", "Toby Ord", "Holden Karnofsky"]
main-institutions: ["Oxford Future of Humanity Institute", "GiveWell", "Open Philanthropy", "FTX Foundation", "Centre for Effective Altruism", "Anthropic", "OpenAI"]
key-theorists: ["Parfit", "Bentham", "MacKenzie", "Porter", "Hacking"]

spine-role: "Part II – moral mathematics apex"
tags: [chapter, part-II, effective-altruism, longtermism, QALYs, population-ethics, moral-mathematics]
---

# Ch8 – Effective Altruism's Cold Equations: The Moral Mathematics of a Optimised Future

## Core Claim
Effective Altruism is not a philosophy that accidentally borrowed mathematical tools — it is a mathematical programme that borrowed the vocabulary of ethics. Expected value calculations, QALY ratios, temporal discount rates, and existential risk probabilities are not instruments that serve EA's moral commitments; they constitute them. The result is the purest expression of the book's central argument: when you build a moral system entirely inside an objective function, the choice of function is everything, and the people who choose it acquire extraordinary power without accountability. EA represents Transition 3's endpoint — the full privatisation of the welfare calculus, now applied not to a national population but to the entire future of humanity.

## Place in the Spine
- Builds on: [[Ch06 - The RAND Corporation's Poor]] — objective-function welfare logic
- Builds on: [[Ch07 - Paypal's Philosophers]] — Silicon Valley's ideological infrastructure and funding networks
- Connects to: [[Ch09 - Venture Capital's Ledger]] — EA as the moral legitimation layer for VC-scale philanthropy
- Looks back to: [[Ch03 - From Poor Law to Social Insurance]] — Beveridge's actuarial risk calculus as the ancestor of QALY reasoning
- Related MM: [[MM-Interlude-C - From Scales to Scores]]

## Mathematical Tools in Play
- Tool(s): Expected value \(E[V] = \sum_i p_i \times v_i\); quality-adjusted life years (QALYs); disability-adjusted life years (DALYs); temporal discount rate \(\delta\) applied to future welfare; population utility functions (total vs. average); existential risk probability estimates (Nick Bostrom's "astronomical value" argument)
- Governance function: Concentrates the power to define human value — which lives count, how much, over what time horizon — in a small network of Oxford-trained philosophers and their funders, while presenting those definitions as the outputs of rigorous calculation rather than political choices.
- Related MM: [[MM-Interlude-C - From Scales to Scores]]

## Key Scenes / Narrative Beats
- [ ] Opening: Oxford Future of Humanity Institute, circa 2010 — Nick Bostrom and colleagues construct probability estimates for human extinction events; existential risk from misaligned AI is calculated at between 10% and 50% over the next century; this number will redirect hundreds of millions of dollars
- [ ] The Drowning Child: Peter Singer's 1972 "Famine, Affluence, and Morality" as the ur-text — the thought experiment that makes expected-value giving feel like a moral obligation; the move from visceral ethics to calculative ethics happens in a single paper
- [ ] GiveWell's Ledger: Holden Karnofsky and Elie Hassenfeld build the first systematic cost-per-life-saved ranking of charities (2007); the methodology is RAND-era cost-effectiveness analysis applied to humanitarian aid; the result is a philanthropic market in which distant lives are priced and compared
- [ ] The Longtermist Turn: MacAskill's *What We Owe the Future* (2022) applies a near-zero discount rate to future people — potential future humans vastly outnumber present ones, so almost all expected value lies in preventing extinction; present poverty, disease, and suffering are arithmetically swamped; the maths that was supposed to help the poor now makes them irrelevant
- [ ] FTX and the Collapse: Sam Bankman-Fried's "earning to give" strategy — maximise income now by any means, donate later to high-expected-value causes — is the logical conclusion of consequentialist expected-value reasoning unconstrained by deontological limits; the fraud is not a betrayal of EA's mathematics but an application of them
- [ ] Contemporary Echo: Anthropic and OpenAI receive major Open Philanthropy funding justified by existential risk calculations; EA effectively becomes the moral governance layer of frontier AI development, with the same small network choosing both the risk estimates and the interventions

## Theoretical Anchors
- [[Parfit - Reasons and Persons]]: the "repugnant conclusion" — in total utilitarian population ethics, a world of billions of barely-worth-living lives can outrank a smaller world of flourishing ones; EA's longtermism implicitly accepts this; this section makes that acceptance explicit and politically legible
- [[Bentham - Introduction to the Principles of Morals and Legislation]]: the felicific calculus as origin point; QALYs are Bentham's utils with a medical gloss
- [[Porter - Trust in Numbers]]: EA's quantitative apparatus performs the same depoliticisation function as RAND's cost-effectiveness ratios — it places the choice of target outside democratic contestation
- [[MacKenzie - An Engine Not a Camera]]: GiveWell's cost-per-life-saved rankings do not merely describe the charitable sector — they reshape it; charities retool to score well on QALY metrics, and the metrics become constitutive of "effectiveness"
- [[Hacking - Making Up People]]: "the effective cause" and "the longtermist" as new kinds of moral person created by EA's classificatory apparatus

## Case Material
- People: [[Peter Singer]], [[William MacAskill]], [[Nick Bostrom]], [[Derek Parfit]], [[Nick Beckstead]], [[Sam Bankman-Fried]], [[Toby Ord]], [[Holden Karnofsky]], [[Elie Hassenfeld]]
- Institutions: [[Oxford Future of Humanity Institute]], [[Centre for Effective Altruism]], [[GiveWell]], [[Open Philanthropy]], [[FTX Foundation]], [[Anthropic]], [[OpenAI]], [[80,000 Hours]]
- Regimes / Systems: [[QALY – technical detail and welfare origins]], [[GiveWell Ranking Methodology]], [[Longtermism – MacAskill's framework]], [[FTX Collapse – legal and financial record]], [[Open Philanthropy – AI safety funding flows]]

## Argument in Sections

### 1. The Utilitarian Inheritance: From Bentham's Utils to the QALY
Jeremy Bentham's felicific calculus (1789) proposed that pleasure and pain were measurable quantities that could be summed across persons to determine the morally correct action. The QALY (Quality-Adjusted Life Year), developed in health economics during the 1960s and 1970s, is Bentham's util operationalised: one year of perfect health equals 1.0 QALY; a year in a wheelchair might equal 0.6; a year in severe pain, 0.2. The arithmetic is seductive because it appears to resolve moral dilemmas without remainder — £30,000 per QALY is the UK's NICE threshold, and treatments above that cost are not funded. What is invisible in this calculation is the prior political choice: who defines the quality weights, whose pain is measured, and whose wellbeing is excluded from the denominator. This section traces the QALY back through post-war health economics (the same institutional moment as Beveridge and RAND) and shows it as the medical branch of the same optimisation tradition.

### 2. Singer's Thought Experiment and the Arithmetisation of Compassion
Peter Singer's 1972 paper "Famine, Affluence, and Morality" contains one of philosophy's most consequential thought experiments: if you walk past a drowning child in a shallow pond, you are obligated to save her even at cost to yourself; geographic distance does not change the moral arithmetic; therefore you are obligated to give to distant strangers until giving more would harm you comparably. The argument is structurally sound within utilitarian ethics, but it performs a transformation that this chapter takes seriously: it replaces emotional, proximate, embodied moral response with a calculative one. The drowning child in the thought experiment has no name, household, or history — she is a unit of suffering in an expected-value equation. Singer's paper is the seed from which EA grows; and it carries inside it, from the beginning, the tendency to abstract away the particular person that Orshansky's matrices were designed to preserve.

### 3. GiveWell's Ledger: When Charity Becomes a Market
GiveWell, founded in 2007 by two former hedge fund analysts, built the first systematic ranking of charities by cost-per-life-saved or cost-per-DALY-averted. The methodology is RAND's cost-effectiveness analysis applied to global health: identify an intervention, estimate the counterfactual, calculate the expected lives saved per dollar, rank charities accordingly. The ranking performs MacKenzie's performativity thesis in real time: charities that score well receive dramatically increased donations; charities that cannot produce QALY-denominated evidence lose funding. The result is not a neutral measurement of pre-existing effectiveness but a reshaping of the charitable sector in the image of the metric. Deworming, bed nets, and direct cash transfers score well; community organising, legal advocacy, and structural change score poorly, because their effects are diffuse and long-delayed. GiveWell's ledger, like Orshansky's poverty line, creates the landscape it claims only to map.

### 4. The Longtermist Turn: When the Maths Disappears the Present
William MacAskill's *What We Owe the Future* (2022) applies a near-zero temporal discount rate to the utilitarian calculus. If future people matter as much as present ones — and if there could be trillions or quadrillions of future people — then almost all expected moral value lies in shaping the long-run trajectory of civilisation rather than in alleviating present suffering. A child dying of malaria today represents a tragedy of roughly one QALY; preventing an existential catastrophe that forecloses a billion-year human future represents an expected value many orders of magnitude larger. The arithmetic is valid inside the framework; but the framework requires accepting Parfit's "repugnant conclusion" (that a vast population of barely-worth-living lives is better than a smaller flourishing one), a near-zero discount rate (a contestable ethical choice presented as obvious), and probability estimates for civilisational risk that have no empirical basis. This section unpacks each of these assumptions and shows that each is a political choice disguised as a mathematical parameter — exactly the structure this book has been tracing since Galton's heritability coefficients.

### 5. FTX, Fraud, and the Logic of Expected Value
Sam Bankman-Fried's "earning to give" strategy — work in finance, maximise income, donate large fractions to EA causes — was not a fringe interpretation of EA ethics but its mainstream application. SBF's own account of his FTX fraud, given in post-collapse interviews, is revealing: the expected value of the fraud succeeding (billions more for EA causes) outweighed the expected value of the fraud failing (reputational damage, legal consequences). This is expected-value reasoning applied without the deontological constraints — rules against lying, theft, fiduciary duty — that most ethical systems maintain precisely because consequentialist calculations are so easily manipulated by those doing the calculating. The FTX collapse is this chapter's *Urban Dynamics* moment: not an aberration from the framework but its reductio ad absurdum, the point at which the objective function logic, followed faithfully, produces a result that reveals what was wrong with the framework from the beginning.

### 6. EA as the Moral Governance of AI: The Capture of a Technology
The chapter closes by tracing Open Philanthropy's funding of Anthropic and OpenAI — justified by existential risk probability estimates generated by the same FHI tradition — as the practical endpoint of EA's mathematical governance project. A small network, using probability estimates with no empirical basis, effectively becomes the moral oversight layer of the most consequential technology being built. The circularity is exact: EA funds the AI labs whose risk estimates justify EA's funding priorities, which fund more AI development, which generates more existential risk estimates. This is a feedback loop in the Ch5 sense — a self-reinforcing control system — but one whose target function was set in Oxford common rooms rather than through democratic deliberation. The connection to Part III's automated poorhouse is direct: the same network that decides which lives merit rescue in the global south, and which futures merit protection from existential risk, will also decide which welfare claimants' data trains the next generation of eligibility models.

## Links Out
- Notes:
  - [[QALY – technical origins in post-war health economics (Fanshel & Bush, 1970)]]
  - [[Parfit – Repugnant Conclusion, full argument and EA adoption]]
  - [[Singer 1972 – Famine, Affluence, and Morality close reading]]
  - [[GiveWell – methodology documentation and critique literature]]
  - [[Bostrom – Astronomical Value argument, primary text]]
  - [[FTX Collapse – legal record, SBF interviews, EA forum responses]]
  - [[Open Philanthropy – AI safety funding flows (amounts, recipients, dates)]]
  - [[MacAskill – What We Owe the Future, discount rate assumption detail]]
  - [[Bentham felicific calculus → QALY lineage – bridge note for Interlude C]]
