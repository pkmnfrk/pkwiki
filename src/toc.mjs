import { repeatString } from "./util.mjs";

const tocMarker = /#toc(?:\s+(\d))?/;

export function handleToc(tokens, md) {
    const headings = [];
    let minLevel = 7;

    for(const token of tokens) {
        if(token.type === "heading_open") {
            headings.push(token);
            const level = parseInt(token.tag.substring(1), 10);
            if(level < minLevel) {
                minLevel = level;
            }
        }
    }

    // now, look for #toc
    for(const token of tokens) {
        if(token.type === "inline" || token.type === "html_block") {
            const result = tocMarker.exec(token.content);
            if(!result) {
                continue;
            }

            const newTokens = buildTocTokens(headings, tokens, minLevel, result[1], md);

            const parts = token.content.split(tocMarker);

            console.log(parts);

            if(parts[0]) {
                newTokens.unshift({
                    ...token,
                    content: parts[0],
                })
            };

            if(parts[parts.length - 1]) {
                newTokens.push({
                    ...token,
                    content: parts[parts.length - 1],
                })
            }

            tokens.splice(tokens.indexOf(token), 1, ...newTokens);
        }
    }

}

function buildTocTokens(headings, tokens, minLevel, levelStr, md) {
    let level = minLevel;
    if(levelStr) {
        level = parseInt(levelStr, 10);
    }

    const newText = buildTocText(headings, tokens, minLevel, level);
    const newTokens = md.parse(newText);

    if(!newTokens[0].attrs) {
        newTokens[0].attrs = [];
    }

    newTokens[0].attrs.push(["class", "table-of-contents"]);

    return newTokens;
}

function buildTocText(headings, tokens, minLevel, level) {
    let newText = "";
    for(const heading of headings) {
        const next = tokens[tokens.indexOf(heading) + 1];
        let id = null;
        for(const [name, value] of heading.attrs) {
            if(name === "id") {
                id = value;
                break;
            }
        }
        const absLevel = parseInt(heading.tag.substring(1), 10);
        if(absLevel > level) {
            continue;
        }
        const thisLevel = parseInt(heading.tag.substring(1), 10) - minLevel;
        const indent = repeatString("   ", thisLevel);
        newText += `${indent}1. [${next.content}](#${id})\n`;
    }

    return newText;
}