const articlesPath = "articles/";

const placeholderColors = [
    { bg: "4B5563", text: "F9FAFB" },
    { bg: "1D4ED8", text: "EFF6FF" },
    { bg: "BE123C", text: "FDE2E8" },
    { bg: "047857", text: "D1FAE5" },
    { bg: "7C3AED", text: "F5F3FF" },
];
let colorIndex = 0;

async function getArticleList() {
    try {
        const response = await fetch("articles.json");
        if (!response.ok) throw new Error("Could not load article list.");
        const data = await response.json();
        return data.files || [];
    } catch (error) {
        console.error("Error fetching article list:", error);
        return [];
    }
}

async function fetchArticleHTML(filename) {
    const response = await fetch(articlesPath + filename);
    if (!response.ok) throw new Error(`Failed to fetch article: ${filename}`);
    const text = await response.text();
    return new DOMParser().parseFromString(text, "text/html");
}

function extractArticleMetadata(doc) {
    const title = doc.querySelectorAll("h1")[1]?.innerText || "No Title";
    const imageSrc = doc.querySelector("img")?.src || null;
    const firstParagraph =
        doc.querySelector("p")?.innerText || "No content available.";
    const timeElement = doc.querySelector("time");
    const publishDate = timeElement
        ? new Date(timeElement.getAttribute("datetime"))
        : new Date(0);
    const displayDate = timeElement?.innerText || "";

    return { title, imageSrc, firstParagraph, publishDate, displayDate };
}

function renderLatestArticle(article) {
    const previewContainer = document.querySelector(
        "#latest-article-preview .preview-card",
    );
    if (!previewContainer) return;

    let imageElementHtml;
    if (article.imageSrc) {
        imageElementHtml = `<img src="${article.imageSrc}" alt="${article.title}" class="preview-image">`;
    } else {
        const color = placeholderColors[colorIndex % placeholderColors.length];
        colorIndex++;
        imageElementHtml = `
                <div class="placeholder-div" style="background-color: #${color.bg}; color: #${color.text};">
                    <h3>${article.title}</h3>
                </div>
            `;
    }

    previewContainer.innerHTML = `
            ${imageElementHtml}
            <div class="preview-card-content">
                <h3>${article.title}</h3>
                <p class="article-date">${article.displayDate}</p>
                <p>${article.firstParagraph}</p>
                <a href="${
                    articlesPath + article.filename
                }" class="read-more">Read More</a>
            </div>
        `;
}

function renderArticleGrid(articles) {
    const gridContainer = document.querySelector(
        "#articles-grid .grid-container",
    );
    if (!gridContainer) return;
    gridContainer.innerHTML = "";

    articles.forEach((article) => {
        let imageElementHtml;
        if (article.imageSrc) {
            imageElementHtml = `<img src="${article.imageSrc}" alt="${article.title}">`;
        } else {
            const color =
                placeholderColors[colorIndex % placeholderColors.length];
            colorIndex++;
            imageElementHtml = `
                    <div class="placeholder-div" style="background-color: #${
                        color.bg
                    }; color: #${color.text};">
                        <h3>${article.title
                            .split(" ")
                            .slice(0, 5)
                            .join(" ")}...</h3>
                    </div>
                `;
        }

        const card = document.createElement("a");
        card.href = articlesPath + article.filename;
        card.classList.add("article-card");

        card.innerHTML = `
                ${imageElementHtml}
                <div class="article-card-content">
                    <h3>${article.title}</h3>
                    <p class="article-date">${article.displayDate}</p>
                </div>
            `;
        gridContainer.appendChild(card);
    });
}

async function init() {
    const articleFiles = await getArticleList();

    if (!articleFiles || articleFiles.length === 0) {
        document.querySelector("#latest-article-preview").style.display =
            "none";
        document.querySelector("#articles-grid .grid-container").innerHTML =
            "<p>No articles yet!</p>";
        return;
    }

    const articles = await Promise.all(
        articleFiles.map(async (filename) => {
            const doc = await fetchArticleHTML(filename);
            const metadata = extractArticleMetadata(doc);
            return { ...metadata, filename };
        }),
    );

    articles.sort((a, b) => b.publishDate - a.publishDate);

    const latestArticle = articles[0];
    const otherArticles = articles.slice(1);

    renderLatestArticle(latestArticle);
    renderArticleGrid(otherArticles);
}

init();
