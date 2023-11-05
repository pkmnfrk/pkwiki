# MDWiki

This is a node package to assist in creating a simple static website from markdown pages.

## Usage

You may choose to install MDWiki globally:

```bash
npm install -g mdwiki
mdwiki <input folder> <output folder>
```

Or locally into a node project:

```bash
npm install mdwiki
npx mdwiki <input folder> <output folder>
```

Either way, the `<input folder>` should contain the following things:
* `_template.html` to define your basic layout. Refer to below for the required format.
* Any other `_<something>.html` include files. Refer to below for the required format.
* A series of Markdown files with your content. Refer to below for the required format.
* Any additional resources (stylesheets, images, etc) to be copied to the output

Refer to the `test` folder in this package for a working example.

### Anatomy of _template.html
This file should be a plain HTML file with all the requisite markup (`<html>`, `<head>`, `<body>`, etc).
This file will be used as the base for _every_ page in the site. You may wish to add a navigation bar,
branding, styling, etc.

It can (and probably should) contain a few placeholders:
* `{{title}}` this will be replaced with the title of the page. Eg, `Cats`
* `{{prefixedtitle}}` this is the same as `{{title}}` but includes a dash in front. Eg, ` - Cats`. Meant for the `<title>` tag.
* `{{body}}` this will be replaced with the rendered content of the page. Eg, `Cats are cute fuzzy creatures typically kept as pets ...`

This file will not be copied to the output directly.

### Anatomy of _<something>.html
Other underscore-prefixed files are used as includes in your pages. Inspite of the extension, these
will be parsed for markdown, allowing for recursively including includes. As such, refer to the
main page section for more details.

One aspect that is only applicable to includes, however, is the parameter replacement. You may include
`{{#1}}`, `{{#2}}`, tags as placeholders in your content. These will be replaced with the first, second, etc
parmaters in the include. Eg, given the include command `{{foo|bar|baz}}`, parameter 1 is `bar` and 2 is `baz`.

You may include a default for the replacements, in case the parameter is not passed. This looks like: `{{#1|default}}`.
So, assuming the include command was `{{foo|bar}}`, then `{{#1|quux}}` will become `bar`, while `{{#2|qaaz}}` will
become `qaaz`.

### Anatomy of a markdown page.

Markdown is largely [CommonMark](https://spec.commonmark.org/) compatible, So, you can start by writing your
text with Markdown. Additionally, the following extensions are provided:

#### Adding a title tag
Somewhere in your document (probably at the top), you may include a title tag that looks like this:

```text
#title My Awesome Title
```

This will set the title for the page to `My Awesome Title`. This is not rendered by default, but you may
include the `{{title}}` placeholder in your template to include it.

#### Linking to other pages
Links are defined by double square brackets:

```text
[[Foo Bar]]
[[Foo Bar|the fooest of bars]]
```

The first syntax is just a plain link to the `foo-bar` page, with a label of `Foo Bar`. The second one
includes a custom label of `the fooest of bars`, but links to the same place.

Note that when resolving a link, the destination text has all special (i.e, not letter, digit or underscore)
characters replaced with dashes, and then the whole thing is lowercased. So, `[[Foo Bar]]`, `[[FOO BAR]]` and
`[[foo-bar]]` are all equivalent, but `[[FooBar]]` is not.

It is possible to include an anchor:

```text
[[Foo Bar#Baz]]
[[Foo Bar#Baz|the bazziest of foobars]]
```

These will be treated as links to `foo-bar`, just as before, but also include an anchor.

Lastly, if a link points to a page that doesn't exist, the link will still be rendered, but it will
have a `class` of `broken` assigned to it. You may wish to style it differently.

For example:
```text
[[Not a real page]]
```

Becomes:
```html
<a href="not-a-real-page.html" class="broken">Not a real page</a>
```

### Includes
You will likely want to reuse some formatting/markup in different places. To do this, you can factor out
your common markup into include files (See above on details how to do this), and then include them:

Given `_awesome.html` template with the following contents:
```html
<blink>{{#1}}</blink>
```

You might use this on a page like so:
```text
Check it out: {{awesome|Blinky blinky hole}}
```

This will render as:
```html
Check it out: <blink>Blinky blinky hole</blink>
```

You may recursively include templates, but don't create circular references, this will cause generation to fail.

