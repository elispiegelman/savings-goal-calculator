# Savings Goal Calculator

A simple, responsive savings calculator built with plain HTML, CSS, and vanilla JavaScript. Estimate your savings growth from a starting balance and monthly deposits, or find the monthly deposit needed to reach a goal. The chart and year-by-year table show contributions and estimated interest; all calculations run in your browser and are not saved or sent anywhere.

## Screenshot

![Screenshot placeholder — add a screenshot of the calculator here](docs/screenshot.png)

## Run locally

Open `index.html` in a browser. No installation, build step, or server is required. An internet connection is needed to load Chart.js from its CDN.

## Deploy on GitHub Pages

1. Create a GitHub repository and add `index.html`, `style.css`, `script.js`, and `README.md` to the repository’s `main` branch.
2. Open the repository’s **Settings** tab.
3. In the sidebar, select **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the `/(root)` folder, then click **Save**.
6. Wait for GitHub Pages to publish the site. The Pages settings screen will show its URL.

## Calculation

The calculator compounds the annual return monthly and adds each monthly contribution at the end of the month. It assumes the return stays constant and does not include taxes, fees, or changes in investment value.