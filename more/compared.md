## Templatize vs Mustache ##

It's not a competition, but it's worth mentioning why there's a big library that emulates most of what [Mustache.js](https://github.com/janl/mustache.js/) does, while while they are similar there are enough differences to make switching between incompatible beyond the basic variables and sections. As aforementioned, this originally developed as an extremely minimal and lightweight implementation of a templating system, that only eventually blew up and became quite a full-on project. Partly because it contains some customizations I prefer and partly just as a side-project for practice.

#### Major syntax and usage differences ####

The support for grammatically formatted [lists](#lists) and built-in formatters are unique to Templatize as well as the options to evaluate zero-values as true.

**Scope for repeating sections**

Mustache treats template code within a repeating section as scoped within (not requiring dot notation to grab values from each list item within that section). Templatize still requires the full dot notation to grab data within a repeating section.

**Scope for functions**

In Mustache, functions called within a section are given the `this` context of the data-binding of the section. Thus calling a function in a repeating section changes the context to the item per iteration. 

In Templatize, functions are by default given the context of where the function lives within the data binding. To provide a different context, it must be explicitly called. See [Dynamically scoping functions](#dynamically-scoping-functions).

**Partials** 

Templatize has no inherent support for partials -- though as Templatize maps and renders on runtime, it is not really necessary.