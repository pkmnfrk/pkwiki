import { repeatString } from "./util.mjs";

const tocMarker = /#toc(?:\s+(\d))?/;

export class TOCGenerator {
    #md;
    /** 
     * @param {import("markdown-it")} md
     */
    constructor(md) {
        this.#md = md;
    }

    handleToc(tokens) {
        tokens = [...tokens];
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
    
                const newTokens = this.#buildTocTokens(headings, tokens, minLevel, result[1]);
    
                const parts = token.content.split(tocMarker);
    
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
        return tokens;
    }
    
    #buildTocTokens(headings, tokens, minLevel, levelStr) {
        let level = minLevel;
        if(levelStr) {
            level = parseInt(levelStr, 10);
        }
    
        const newText = this.#buildTocText(headings, tokens, minLevel, level);
        if(!newText) {
            return [];
        }
        const newTokens = this.#md.parse(newText);
    
        if(!newTokens[0].attrs) {
            newTokens[0].attrs = [];
        }
    
        newTokens[0].attrs.push(["class", "table-of-contents"]);
    
        return newTokens;
    }
    
    #buildTocText(headings, tokens, minLevel, level) {
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
            const indent = repeatString("   ", absLevel - minLevel);
            newText += `${indent}1. [${next.content}](#${id})\n`;
        }
    
        return newText;
    }
}
