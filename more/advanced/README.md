## Advanced usage, edge cases, and general weirdness

#### Mutli-dimensional arrays

By using the in-context directive, you can access multi-dimensional arrays.

&nbsp; *Template:*

```
{{#a}}
  {{a}} => {{#a}}{{.}}, {{/a}}
  <br />
{{/a}}
```

&nbsp; *Bindings:*

```javascript
{a: [[0,1], [2,3], []]}
```

&nbsp; *Outputs:*

```
[0,1] => 1,
[2,3] => 2, 3,
[] =>
```

Note the value before the `=>` is the raw array content. The tag here is evaluated as the item of the array for `a` inside each iteration of the repeating section (not 'a' itself). After the `=>` we enter a section with that data, which will be another repeating section with the context shifted to the inner level. The naked-context tag inside this section is now referencing each inner array's value.

Note that in the first line, after the split, "0" is not printed as the default behavior is to treat zero-values as false, hence skipping that iteration of the repeating section. And in the third line, nothing prints after the split since the array is empty.

**Another wrinkle**

We could in fact use all naked-context tags. E.g. the below template produces the same output:

```
{{#a}}
  {{.}} => {{#.}}{{.}}, {{/.}}
  <br />
{{/a}}
```

However, replacing all the naked-context tags with the `a` key will eventually result in confusion in interpreting the context for the inner-most section. Hence, for this edge-case, we recommend using the naked-context tags after one level of nesting.

&nbsp; *Template:*

```
{{#a}}
  {{a}} => {{#a}}{{a}}, {{/a}}
  <br />
{{/a}}
```

&nbsp; *Outputs:*

```
[0,1] => [0,1],
[2,3] => [2,3], [2,3],
[] =>
```

Generally though, it's not recommended to use multi-dimensional arrays and instead wrap the nested array as a property of an array of objects.

&nbsp; *Template:*

```
{{#a}}
  {{#.b}}{{.}} {{/.b}}
  <br />
{{/a}}
```

&nbsp; *Bindings:*

```javascript
{
  a: [
    {b: [1, 2]}, 
    {b: [3, 4]}, 
    {b: [5, 6]}
  ]
}
```

&nbsp; *Outputs:*

```
1 2
3 4
5 6
```

&nbsp;

#### Arrays of functions

You can in fact supply an array of functions for a repeating section, then use each function in the section's context.

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
      if(!this.name) return true;
      return this.name.first + " " + this.name.last + "<br />";
    }, 
    function() {
      if(!this.name) return true;
      return this.name.last === "Belcher" ? "- is family<br />" : "";
    }, 
    function() {
      if(!this.name) return true;
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

Note however that the function will be evaluated in it's own context to determine whether to render the section. In the above example, the functions only make sense within the context of an item in `people`. Thus the if statements were added to each to protect against and error when traversing into an undefined property of the context.

&nbsp;

#### Passing a function to itself

When passing a function as a context to itself, the function will first be evaluated as is until it returns a valid context (that is, a non-function), then pass to itself as a function. Normally, this is kind of pointless or results in weird behavior, but it might be worth knowing as an edge case.

&nbsp; *Template:*

```
1. {{&removeFirst.list}}<br />
2. {{removeFirst->removeFirst}}<br />
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
2. [[object Object]]
3. three and four
```

Line 1 calls `removeFirst` which returns an object it can render `list` from. 

Line 2 takes the object returned in line call, then uses it as a context to call the function again, which removes another item. However, we have a problem as we can't access the property `list`. Adding dot-notation to this key (e.g. `{{removeFirst->removeFirst.list}}`) would be interpreted as trying to find a function called `removeFirst.list`, which returns an array and would thus raise an exception as a context was passed to a non-function. Hence while the object returned is `{list: ["three", "four"]}`, it cannot be properly displayed and instead simply prints the ugly "[[object Object]]".

Now we're getting slightly ahead of ourselves, but line 3 works around this by taking this output into a section, then using the section context to access the data in the context with another tag (which is covered in [the following section](#mixing-directives-in-a-section-tag)).

Additionally, the above example uses a case where in function modifies the data binding. In general, this is **highly discouraged**. For more on this see [Function evaluation and modifying binding data](#function-evaluation-and-modifying-binding-data).

&nbsp; 

#### Mixing directives in a section tag

Section tags may have in-context or pass-to-function directives. This will resolve automatically, and in the latter case, ensure the data context is what results from the operations called in the opening tag. 

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

Ensure for in-context directives used as section tags that the closing tag appears *exactly* as shown in the opening tag. The below template would result in an error, even if the section tags refer to the same binding.

```
{{#burger}}
  Available toppings:<br />
  {{#.toppings}}{{spacer}}- {{.}}<br />{{/burger.toppings}}
{{/burger}} 
```

Additionally, as shown in the last section, you can set a context-passed-to-function as the section tag. This will also create a dynamic context for any tags with in-context directives directly under this section. Note that the closing tag does not need to mimic the pass-to-function part of the opening tag.

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

**DO NOT DO THIS** and here's why. Along with the caching issue ([covered in the function section](../functions/#function-evaluation-and-caching)) with nested sections, especially with repeating sections, Templatize takes some optimization strategies to best render the template with the least amount of rendering calls. While it takes certain edge cases to bring this behavior out, when it does, it can appear very unpredictable.

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

To understand what's happening here it's worth overviewing the Templatize rendering process. Templatize first renders normal sections from the outside-in. This allows optimization in the case where a hidden section is encountered, by skipping the section entirely and avoiding rendering of all interior content. It then renders all repeating sections from the inside-out to avoid redundancy. However, the interior of repeating sections are checked in the first pass to render tags bound to (assumedly) non-dynamic content unrelated to the repeating section, again, to prevent the redundancy of calling the same thing multiple times.

So in the first pass, the `{{#section}}` tags and the inner call to `count` therein are handled, first putting the value of '1' inside the outer repeating section.

The other calls to `count` require the dynamic context of the repeating sections (since the context `.` in each passed to the function -- even if not really used in the function -- points to the repeating section data). So these tag are not rendered in this first pass.

On the next pass, the repeating sections are rendered. The first part has been pre-rendered (as '1'), which is why it repeats to start each line. Because the optimization renders repeating sections from the inside out, the `{{#inner}}` section is rendered first, evaluation the inner calls to `count` there, then the outer call to `count` next, even if it occurs before the inner section.

I'm sure someone could construe a scenario in which this pattern could be taken advantage of, but it's hard to imagine. Thus as a general rule, **avoid functions that modifying the data bindings or return different values depending on the number of times called.**

&nbsp;