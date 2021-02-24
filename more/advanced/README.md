## Edge cases, mixing directives, and general weirdness

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

Now we're getting slightly ahead of ourselves, but line 3 works around this by taking this output into a section, then using the section context to access the data in the context with another tag.

&nbsp; 

#### Mixing directives in a section tag

Section tags may have in-context or pass-to-function directives. This will resolve automatically, and in the latter case, ensure the data context is what results from the operations called in the opening tag. 

Ensure for in-context directives that the closing tag appears *exactly* as shown in the opening tag.

&nbsp; *Template:*

```
{{#burger}}
  Available toppings:<br />
  {{#.toppings}}{{tab}}- {{.}}<br />{{/.toppings}}
{{/burger}} 
```

&nbsp; *Bindings:*

```javascript
{
  tab: "&nbsp;&nbsp;&nbsp;&nbsp;",
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

But note the below template would result in an error, even if the section tags refer to the same binding.

```
{{#burger}}
  Available toppings:<br />
  {{#.toppings}}{{tab}}- {{.}}<br />{{/burger.toppings}}
{{/burger}} 
```

Additionally, as shown a bit previously, you can set a context-passed-to-function as the section tag. This will also create a dynamic context for any tags with in-context directives directly under this section. Note that the closing tag does not need to mimic the pass-to-function part of the opening tag.

```
{{#burger}}
  Available add-ons:<br />
  {{#.addons->withPrices}}
    {{tab}}- {{.name}} +{{.price::$.2f}}<br />
  {{/.addons}}
{{/burger}} 
```

&nbsp; *Bindings:*

```javascript
{
  tab: "&nbsp;&nbsp;&nbsp;&nbsp;",
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

#### Arrays of functions

&nbsp;

#### Mutli-dimensional arrays

&nbsp;