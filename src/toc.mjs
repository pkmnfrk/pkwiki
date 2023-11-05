import { repeatString } from "./util.mjs";

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
        if(token.type === "inline" && token.content.indexOf("#toc") === 0) {
            const levelStr = token.content.substring(4);
            let level = minLevel;
            if(levelStr) {
                level = parseInt(levelStr, 10);
            }
            
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
            // console.log(newText);
            const newTokens = md.parse(newText);

            // console.log(newTokens[0]);

            if(!newTokens[0].attrs) {
                newTokens[0].attrs = [];
            }

            newTokens[0].attrs.push(["class", "table-of-contents"]);

            tokens.splice(tokens.indexOf(token), 1, ...newTokens);
        }
    }

}