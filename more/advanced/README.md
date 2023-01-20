## Advanced usage, edge cases, and general weirdness

* [Mutli-dimensional arrays](#mutli-dimensional-arrays)
* [Arrays of functions](#arrays-of-functions)
* [Directives in chained functions](#directives-in-chained-functions)
* [Passing a function to itself](#passing-a-function-to-itself)
* [Mixing directives in a section tag](#mixing-directives-in-a-section-tag)
* [Function evaluation and modifying binding data](#function-evaluation-and-modifying-binding-data)

&nbsp; 

#### Mutli-dimensional arrays

By using the in-context directive, you can access multi-dimensional arrays.

&nbsp; *Template:*

```
{{#a}}
  {{a}} => {{#a}}{{.}} {{/a}}<br />
{{/a}}
```

&nbsp; *Bindings:*

```javascript
{a: [[0,1], [2,3], []]}
```

&nbsp; *Outputs:*

```
[0,1] => 1
[2,3] => 2 3
[] =>
```

The tag before the `=>` prints the raw array value. As this is within a repeating section, the value is evaluated for each iterated item of the array (not the top-level array 'a' itself). 

After the `=>` we further enter that item as another section -- in this case a repeating section with the context shifted to second-level of the array. The naked-context tag inside this section is now referencing each inner array's value.

Note that in the first line, after the split, "0" is not printed as the default behavior is to treat zero-values as false, hence skipping that iteration of the repeating section (an example where we would want to [treat 0-values as true](../sections/#treating-zero-values-as-true)). And in the third line, nothing prints after the split since the array is empty.

&nbsp; 

We also could use all naked-context tags. The below template produces the same output. 

```
{{#a}}
  {{.}} => {{#.}}{{.}} {{/.}}<br />
{{/a}}
```

Which format looks better is up to the user.

&nbsp;

#### Arrays of functions

You can supply an array of functions for a repeating section. In the below example, not only is this done to cycle through three functions, but it is combined with the pass-context-to-function.

&nbsp; *Template:*

```
{{#people}}
  {{#funcs}}
    {{people->funcs}}
  {{/funcs}}
  <br />
{{/people}} 
```

&nbsp; *Bindings:*

```javascript
{
  people: [ 
    {
      name: {first: "Linda", last: "Belcher"}, 
      friendly: true
    }, 
    {
      name: {first: "Teddy", last: ""}, 
      friendly: true
    }, 
    {
      name: {first: "Jimmy", last: "Pesto"}, 
      friendly: false
    } 
  ], 
  funcs: [
    function() {
      if(!this.name) return 1;
      return this.name.first + " " + this.name.last + "<br />";
    }, 
    function() {
      if(!this.name) return 1;
      return this.name.last === "Belcher" ? "- is family<br />" : "";
    }, 
    function() {
      if(!this.name) return 1;
      return this.friendly ? "- is a friend<br />" : "";
    }
  ]
}
```

&nbsp; *Outputs:*

```
Linda Belcher
- is family
- is a friend

Teddy
- is a friend

Jimmy Pesto

```

Note however that the above functions only make sense within the context of an item in `people`. Thus the if-statements returning 1 were added to each to protect against an error when traversing into an undefined property of the context. Because the functions are never used in the template outside the context of an item in `people`, the resulting "1" value is never printed. 

*However* these functions are evaluated in the repeating section `{{#func}}`, using the raw context (in this case resolving to the root binding), wherein the if-statements do come into play. If the if-statements returned false (or 0 or whitespace), they would be excluded from the repeating section render. Thus they must return a truthy value (or 0 with [the option to treat zero-values as true](../sections/#treating-zero-values-as-true)).

&nbsp;

#### Directives in chained functions

When chaining functions, each function key is separately considered, so it is allowed to use the in-context directive (`.`) and formatting directives within individual functions called in the chain.

&nbsp; *Template:*

```
{{#belchers.children}}
  {{#functions}}
    {{belchers.children->.fullname::capitalize->.label}}
  {{/functions}}
  <br />
{{/belchers.children}}
```

&nbsp; *Bindings:*

```javascript
{
  belchers: {
    familyName: "belcher", 
    children: [
      {name: "tina"}, 
      {name: "gene"}, 
      {name: "louise"}
    ]
  }, 
  i: 0, 
  alphabet: ['a', 'b', 'c'], 
  functions: {
    label: function(root) {
      return root.alphabet[root.i++] + ". " + this;
    }, 
    fullname: function(root) {
      return this.name + " " + root.belchers.familyName;
    }
  }
}
```

&nbsp; *Outputs:*

```
a. Tina Belcher
b. Gene Belcher
c. Louise Belcher
```

&nbsp;

The functions `fullname` and `label` are called via shorthand with the in-context directive as they are within the section for `#functions`. Note that the value (passed as context) for `belchers.children` could be accessed via a naked in-context directive when directly under it's own section, however, it loses the context in the inner section for `#functions`, as the context for a tag refers to the most-direct section parent.

The format directive for word capitalization, because it comes after calling `fullname`, does not capitalize the labels, because labeling happens further down the chain.

&nbsp;

Any part of the chain that has a format directive will be converted into a string – even if the directive doesn't really result in any apparent change to the value. If this is not considered when passed to a function down the chain, this may result in unexpected behavior or in the function failing.

&nbsp; *Template:*

```
{{value->addTen::encode}}<br />
{{value::encode->addTen}}
```

&nbsp; *Bindings:*

```javascript
{
  value: 1, 
  addTen: function() { return this+10; }
}
```

&nbsp; *Outputs:*

```
11
110
```

&nbsp;

#### Passing a function to itself

When passing a function as a context to itself, the function will first be evaluated as-is until it returns a valid context (that is, a non-function), then pass to itself as a function. Normally, this is kind of pointless or results in weird behavior, but it might be worth knowing as an edge case.

&nbsp; *Template:*

```
1. {{&removeFirst.list}}<br />
2. {{&removeFirst->removeFirst}}<br />
3. {{#removeFirst->removeFirst}}{{&.list}}{{/removeFirst}}
```

&nbsp; *Bindings:*

```javascript
{
  list: ["one", "two", "three", "four"], 
  removeFirst: function() {
    return {list: this.list.slice(1)};
  } 
}
```

&nbsp; *Outputs:*

```
1. two, three, and four
2. {"list":["three","four"]}
3. three and four
```

Line 1 calls `removeFirst` which returns an object it can render `list` from. 

Line 2 takes the object returned from `removeFirst` when called, then uses it as a context to call the function again, which removes another item. However, we can't access the property `list` in the template. Adding dot-notation to this tag (e.g. `{{removeFirst->removeFirst.list}}`) would be interpreted as trying to find a function called `removeFirst.list`, which returns an array and would thus raise an exception as a context was passed to a non-function. Hence while the object returned is `{list: ["three", "four"]}` which is printed as is.

Line 3 works around this by using the output into a section, then using the section context to access the data in the context with another tag (which is covered in [the following section](#mixing-directives-in-a-section-tag)).

&nbsp; 

#### Mixing directives in a section tag

Section tags may have in-context or pass-to-function directives. This will resolve automatically and, in the latter case, ensure the data context is what results from the opening section tag. 

&nbsp; *Template:*

```
{{#burger}}
  Available toppings:<br />
  {{#.toppings}}{{spacer}}- {{.}}<br />{{/.toppings}}
{{/burger}} 
```

&nbsp; *Bindings:*

```javascript
{
  spacer: "&nbsp;&nbsp;&nbsp;&nbsp;",
  burger: {
    toppings: ["cheese", "onions", "lettuce", "tomato"]
  }
}
```

&nbsp; *Outputs:*

```
Available toppings:
    - cheese
    - onions
    - lettuce
    - tomato
```

&nbsp;

Ensure when using in-context directives as section tags that the closing tag appears *exactly* as shown in the opening tag. The below template would result in an error, even if the section tags refer to the same binding.

```
{{#burger}}
  Available toppings:<br />
  {{#.toppings}}{{spacer}}- {{.}}<br />{{/burger.toppings}}
{{/burger}} 
```

&nbsp;

When using a context-passed-to-function as the section tag, this will create the appropriate dynamic context for any tags with in-context directives directly inside this section. Note that the closing tag does not need to mimic the pass-to-function part of the opening tag.

```
{{#burger}}
  Available add-ons:<br />
  {{#.addons->withPrices}}
    {{spacer}}- {{.name}} +{{.price::$.2f}}<br />
  {{/.addons}}
{{/burger}} 
```

&nbsp; *Bindings:*

```javascript
{
  spacer: "&nbsp;&nbsp;&nbsp;&nbsp;",
  burger: {
    addons: ["cheese", "bacon", "avocado"]
  }, 
  prices: { 
    cheese: 0.5, 
    bacon: 2, 
    avocado: 1.5
  }, 
  withPrices: function(root) {
    return this.map(name => ({
      name: name, 
      price: root.prices[name]
    }));
  }
}
```

&nbsp; *Outputs:*

```
Available add-ons:
    - cheese +$0.50
    - bacon +$2.00
    - avocado +$1.50
```

&nbsp;

#### Function evaluation and modifying binding data

**DO NOT DO THIS** and here's why. Along with the caching issue ([covered in the function section](../functions/#function-evaluation-and-caching)) with nested sections, and especially with repeating sections, Templatize takes some optimization strategies to best render the template with the least amount of rendering calls. While it takes certain edge cases to cause this behavior to become pronounced, when it does, it can appear very unpredictable.

In the below, the `count` function is always passed to a context to force re-evaluation. However, even then, the results are not intuitive.

&nbsp; *Template:*

```
{{#outer}}
  {{#section}}
    {{.->count}}
  {{/section}}
  -
  {{.->count}}
  -
  {{#inner}}
    {{.->count}}
  {{/inner}}
  <br />
{{/outer}}
```

&nbsp; *Bindings:*

```javascript
{
  i: 0, 
  outer: [1,2,3], 
  inner: [1,2], 
  section: true, 
  count: function(root) { return ++root.i; }
}
```

&nbsp; *Outputs:*

```
1 - 4 - 2 3
1 - 7 - 5 6
1 - 10 - 8 9
```

To understand what's happening here it's worth overviewing the Templatize rendering procedure. Templatize first renders normal sections from the outside-in. This allows optimization in the case where a hidden section is encountered, by skipping the section entirely and avoiding computing of all interior content (which will not be displayed). It then renders all repeating sections from the inside-out to avoid redundancy. The interior of repeating sections are checked in their first pass to render tags bound to (assumedly) non-dynamic content unrelated to the repeating section in the hopes of preventing the redundant calling the same thing multiple times.

So in the first pass, the `{{#section}}` section and the inner call to `count` therein are handled, first putting the value of '1' as the first part of the `{{#outer}}` repeating section. The other calls to `count` require the dynamic context of the repeating sections (since the context `.` in each is the repeating section data, which changes with each repeat rendering). So these tag are not rendered in this first pass.

On the next pass, the repeating sections are rendered. The first part has been pre-rendered (as '1'), which is why it repeats at the start of each line. Because the optimization renders repeating sections from the inside out, the `{{#inner}}` section is rendered first, evaluating the inner calls to `count` there, then the outer call to `count` next, even if it occurs before the inner section.

I'm sure someone could construe a scenario in which this pattern could be taken advantage of, but it's hard to imagine. Thus as a general rule, **avoid functions that modifying the data bindings or return different values depending on the number of times called.**

&nbsp;