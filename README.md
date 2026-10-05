# COMPAS Fairness Lab

Interactive classroom discussion site for a Data Ethics case study on COMPAS and technical fairness.

## Live site

After GitHub Pages is enabled for this repository, the site will be available at:

https://pat-zhu.github.io/compas-fairness-lab/

## Classroom flow

1. Warm-up: COMPAS vs. human judge
2. ProPublica vs. Northpointe fairness definitions
3. Stakeholder breakout
4. “We don't use race” discussion
5. Threshold trade-off lab
6. 99.9% accurate COMPAS thought experiment
7. Who should define fairness?
8. Data-science design principles
9. Final re-vote and debrief

## Privacy / data

This version is fully static. Responses are stored in the participant's own browser with `localStorage`. No names or answers are sent to a backend.

That makes the site easy to host on GitHub Pages and lets every student open the same activity, but it does **not** aggregate class votes across devices yet.

## Local preview

From the repository folder:

```bash
python -m http.server 8000
```

Then open http://localhost:8000

## Sources

The activity links to the assigned COMPAS case-study readings from ProPublica, The Washington Post archive, and MIT Technology Review. The threshold lab is explicitly a toy dataset for classroom discussion, not actual COMPAS data.
