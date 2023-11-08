import { splitByPipe, safeName } from "./util.mjs";

const LBRACKET = '['.charCodeAt(0);
const RBRACKET = ']'.charCodeAt(0);

/*
Notes on how Markdown-it plugins work: (possibly only for inline ones)

The general flow of the plugin is to identify if the current position (represented by state.pos)
is the start of the markup you care for. For example, if you want to parse a wiki link
(such as "[[test]]"), you use state.pos to see if the next two characters are [[, if there is
enough text left to make a valid link, is there a ]] some point before we hit state.maxPos, etc.

If there isn't, then you need to leave state.pos and state.maxPos alone and return false;

If there is, you need to read in the markup you care about. You should know when it starts and
ends. Once you have it, you can do what you need to do with it. Eg, in our case, we want to
emit tokens to represent a link (link_open, <stuff in the middle>, link_close).

To handle the stuff in the middle, we basically need to adjust the state.pos to point to that
content, and state.maxPos to bound it, then call state.md.inline.tokenize to restart parsing
and handle the arbitrary markup in the middle. This will emit one or more tokens representing it.

Finally, when we're done, we restore state.maxPos, and put state.pos to just after our closing
token, and return true

*/
/**
 * 
 * @param {import("markdown-it/lib/rules_inline/state_inline")} state
 * @param {*} silent 
 * @returns 
 */
function wikiLink(state, silent) {
    let found = false,
        content,
        token,
        max = state.posMax,
        start = state.pos,
        end;

    // if we're too close to the end to fit a full link, then it's not a match
    if (start + 5 >= max) {
        return false;
    }

    // obviously, if there are not two opening brackets, not a match
    if (state.src.charCodeAt(start) !== LBRACKET || state.src.charCodeAt(start + 1) !== LBRACKET) {
        return false;
    }
    
    // if we're just validating, dont' worry about it
    if(silent) {
        return false;
    }

    // move the cursor to just inside the [[
    state.pos += 2;

    // scan forward looking for ]]
    while(state.pos < max - 1) {
        if(state.src.charCodeAt(state.pos) === RBRACKET && state.src.charCodeAt(state.pos + 1) === RBRACKET) {
            found = true;
            break;
        }

        // this just does state.pos++, I think
        state.md.inline.skipToken(state);
    }

    // if we escape the look without finding the end, or we didn't move at all, then it wasn't a
    // real match after all, so put pos back and abort
    if (!found || start + 2 === state.pos) {
        state.pos = start;
        return false;
    }

    end = state.pos + 2;

    // now we know for sure there is a proper [[ and ]] pair, so extract the bit from the middle
    content = state.src.slice(start + 2, state.pos);
    
    // reject any embedded new lines
    if (content.match(/(^|[^\\])(\\\\)*\n/)) {
        state.pos = start;
        return false;
    }

    // wiki links have the following extended syntax:
    // [[Destination#Anchor|Label]]
    // If Label is omitted, then it will use Destination as the Label. Label can have inline markup
    
    // split the content by pipes, and get the start/end pairs of each section
    // (we need the positions so we can parse the label, if provided)
    const segments = splitByPipe(content, true);
    let dest = content.slice(segments[0][0], segments[0][1]);
    let anchor = "";
    let useDest = false;

    // If there is an Anchor, then extract it from Destionation
    if(dest.indexOf("#") !== -1) {
        [dest, anchor] = dest.split("#");
        anchor = "#" + anchor;
    }

    // No label, so indicate that we want to use the Destination instead
    if(segments.length === 1) {
        useDest = true;
    }

    // create the <a> tag
    let attrs = [
        ["href", `${safeName(dest)}.html${anchor}`],
        ["class", "wiki-link"],
    ];
    token = state.push("link_open", "a", 1);
    token.attrs = attrs
    
    if(useDest) {
        // it has to be plain text, so lets just create the text token
        token = state.push("text");
        token.content = dest
    } else {
        // set the parser context to just the label
        state.pos = segments[1][0] + 2 + start;
        state.posMax = segments[1][1] + 2 + start;

        // now, parse as inline content. this creates the inner tokens
        state.linkLevel++;
        state.md.inline.tokenize(state);
        state.linkLevel--;
    }

    // create the </a> tag
    token = state.push("link_close", "a", -1);

    // finally, put the cursor after our closing tag, so we can resume.
    state.pos = end;
    state.posMax = max;
    return true;
}

export function wikiLink_plugin(md) {
    md.inline.ruler.after("text", "", wikiLink);
}