## Templatize vs Mustache.js

It's not a competition, but it's worth mentioning why there's a big library that emulates most of what [Mustache.js](https://github.com/janl/mustache.js/) does. While they are similar in many ways, there are enough differences to make switching between incompatible beyond the basic variables and sections.

&nbsp;

### Differences

While the most basic usage is similar, there are a few minor syntactic and conceptual differences.

**HTML escaping**

Mustache pre-escapes all rendering content for HTML special characters, requiring the `&`-directive (or triple curly braces) to specifically not escape. Templatize, by default, does the opposite (not pre-escaping any render, unless specified to [escape all in the options](../../#options)). Escaping can be done with formatting directives, with the quickest method being suffixing with a semicolon (`;`).

&nbsp; *in Mustache:*

```
{{text}} is escaped
{{&text}} is unescaped
{{{text}}} is unescaped
```

&nbsp; *in Templatize:*

```
{{text}} is unescaped
{{text;}} is escaped
{{text::encode}} is escaped
```

**Lists**

The `&`-directive is handled differently. In Mustache it is a formatting operator. In Templatize it is a [list](../../#lists) operator.

**Functions**

Passing data to functions in Mustache means turning the function into a section tag and putting context in between. The function will then be passed the template text and rendering function inside the section, but not the actual data. 

&nbsp; *in Mustache:*

```
{{#function}}
  template to be passed to function
{{/function}}
```

In Templatize, functions bound to a section tag use the output of the function as the binding to the section tag (see [basic usage of functions](../../#functions)). Functions are called with the context of where they hierarchically exist in the data-binding. 

To pass data to functions, one can use the [pass-context-to-function directive](../functions/README.md#passing-context-to-functions), which passes the data binding specified to the function. 

&nbsp; *in Templatize:*

```
{{context->function}}
```

Passing the (rendered) template within a section can be done with the special pass-section-as-context directive, by an inclusive section tag immediately to a pass-context-to-function directive.

&nbsp; *in Templatize:*

```
{{#->function}}pass this rendered as context{{/function}}
```

**Data context in sections**

Data context is one of the biggest usage differences that may trip up someone switching between the two libraries. Context in Mustache is automatically assumed from within a section. If the data binding is:

&nbsp; *Bindings:*

```javascript
{
  outer: {inner: "inside"}, 
  inner: "outside"
}
```

In Mustache, within an `outer` section you can call `inner` without traversing the data-tree. The following would print `"inside"`. It would only print `"outside"` if `outside.inner` did not exist as a fallback as it traverses to the outer context.

&nbsp; *Template:*

```
{{#outer}} {{inner}} {{/outer}}
```

However, in Templatize, all variables search from the root, even within a section. The above would print `"outside"` as the `{{inner}}` tag is resolved from the root. To print `"inside"` the full data path or [in-context directive](../../README.md#scoping-and-the-context-directive) must be used.

&nbsp; *Template:*

```
{{#outer}} {{outer.inner}} or {{.inner}} {{/outer}}
```

&nbsp;

### Advantages to Templatize

The support for grammatically formatted [lists](../../#lists) and built-in [formatters](../../#formatting) are unique to Templatize.

[Functions](../functions/) are incredibly powerful when combined with the [pass-context-to-function directive](../functions/#passing-context-to-functions) or [mixed in with section tags](../advanced/#mixing-directives-in-a-section-tag).

Templatize has [an option to evaluate zero-values as true](../../#options). Sometimes useful, especially for data where 0 is a real value but `null` is not.

&nbsp;

### Which is better?

Both run quickly – depending on input template and data of course – the first pass render will be on the order of a one to a few milliseconds and subsequent passes on the same template (utilizing caching strategies on the parsed template) will be multiple times faster. But in general, Mustache.js is faster.

The dynamic way Templatize treats functions, sections, and repeating-sections have added some overhead to the data-binding handling and rendering procedures that come at a minor cost. That said, outside of some exceptional cases, there is unlikely to be a factor in which either rendering library is a limiting factor.

Templatize has much more versatility with the enhanced power for functions and ability to pass data to them. That said, most uses cases wouldn't need them or could work around them by preprocessing the data-bindings first.

This has really just become a pet project of mine, so considering the larger developing community, support, active development, and user-base, Mustache.js is probably, maybe, very-slightly, subjectively better for most use cases :)

&nbsp;
