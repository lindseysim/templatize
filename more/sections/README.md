## Sections

Section starts are tags with the `#`-directive and the sections end at tags with the `/`-directive. If the data bound to the section tag evaluates as true, it will be shown, and hidden if it evaluates to false. You may also use an inverse section by replacing the hash (`#`) starting prefix with a caret (`^`). Such sections will only be displayed if the section is evaluated to `false`.

Data may be put inside of a section, whether from elsewhere or the same data-binding.

&nbsp; *Template:*

```
Bob is {{#married}}married{{/married}}{{#single}}single{{/single}}.<br />
{{#spouse}}Bob is married to {{spouse}}.{{/spouse}}<br />
Bob has {{^haspets}}no pets{{/haspets}}{{#haspets}}pets{{/haspets}}.
```

&nbsp; *Bindings:*

```javascript
{
  married: true, 
  single: false, 
  spouse: "Linda", 
  haspets: false
}
```

&nbsp; *Outputs:*

```
Bob is married.
Bob is married to Linda.
Bob has no pets.
```

&nbsp;

### Section value evaluation

The data bound to a section tag is evaluated for 'truthiness'. Values of `undefined`, `null`, an empty string or a string composed only of whitespace, an empty array, and `0` evaluate as false. Otherwise, as long as data-binding for section evaluates to true, it will be treated as such. You may use this as a shortcut for both displaying the section and formatting its value.

&nbsp;

### Example section design patterns

Using the above, one common pattern is to use the same data-binding for both the section tag and the variable tag within.

&nbsp; *Template:*

```
{{#job}}Occupation: {{job}}{{/job}}
```

&nbsp; *Bindings:*

```javascript
{job: "Chef"}
// or conversely, which will hide the section..
{job: null}
```

&nbsp; *Outputs:*

```
Occupation: Chef
```

With the [context directive](../../#scoping-and-the-context-directive), this can be even further simplified in the template.

&nbsp; *Template:*

```
{{#job}}Occupation: {{.}}{{/job}}
```

An alternative approach is to use an object for the section data.

&nbsp; *Template:*

```
{{#job}}Occupation: {{job.title}}{/job}}
```
 
&nbsp; *Bindings:*

```javascript
{job: {title: "Chef"}}
// or conversely, which will hide the section..
{job: false}
```

&nbsp;

### Treating zero-values as true

There may be cases in which you do want section tags to evaluate zero-values as true.

&nbsp; *Template:*

```
Profit:<br />
Monday - {{#monday}}{{monday::$.2f}}{{/monday}}{{^monday}}Closed{{/monday}}<br />
Sunday - {{#sunday}}{{sunday::$.2f}}{{/sunday}}{{^sunday}}Closed{{/sunday}}<br />
Saturday - {{#saturday}}{{saturday::$.2f}}{{/saturday}}{{^saturday}}Closed{{/saturday}}<br />
```

&nbsp; *Bindings:*

```javascript
{
  monday: null, 
  sunday: 0, 
  saturday: 122
}
```

&nbsp; *Outputs:*

```
Profit:
Monday - Closed
Sunday - Closed
Saturday - $122.00
```

By setting `evalZeroAsTrue` to true in the [options](../../#options), you can change this behavior to treat zero-values as truthy. Which will change to output as follows.

&nbsp; *Outputs:*

```
Profit:
Monday - Closed
Sunday - $0.00
Saturday - $122.00
```

&nbsp;

### The `_display` parameter

Section data may still be filled out but removed/hidden if a `_display` variable exists and evaluates to  false (this behavior evaluates truthiness by standard javascript conventions).

&nbsp; *Template:*

```
Occupation: {{#job}}{{job.title}}{/job}} {{^job}}Unemployed{{/job}}<br />
Bob is a {{job.title}}
```

&nbsp; *Bindings:*

```javascript
{
  job: {
    title: "Chef", 
    _display: false
  }
}
```

&nbsp; *Outputs:*

```
Occupation: 
Bob is a chef.
```

Note in the above that `_display` does not reverse the behavior of inverse sections (the section `{{^job}}Unemployed{/job}}` is still hidden as `job` itself is not evaluated to `false`). Also, nested section data may still be accessed and rendered outside of the section, even if the section itself is set not to display.


&nbsp;


## Repeating Sections

If the value bound to a section tag is an array (or function that evaluates to an array), the section will be repeated for as many items as exists in the array. 

Within the context of the repeating section, the same tag is temporarily bound to the value of each item during each iteration. Thus the below section tag key and value key are the same for this array of flat values.

&nbsp; *Template:*

```
{{#children}}Child: {{children}}<br />{{/children}}
```

&nbsp; *Bindings:*

```javascript
{children: ["Tina", "Gene", "Louise", "", null, false, 0]}
```

&nbsp; *Outputs:*

```
Child: Tina
Child: Gene
Child: Louise
```

Note that each item is also treated to the same [section value evaluation](./more/sections/#section-value-evaluation) to determine whether it is rendered.

Arrays may contain objects or functions as well. In objects, you can use the `_display` parameter to hide a particular item, same as you would for a section. Below, we also take advantage of the [in-context directive](#../#scoping-and-the context-directive).

&nbsp; *Template:*

```
{{#children}}Child: {{.firstName}}<br />{{/children}}
```

&nbsp; *Bindings:*

```javascript
{
  children: [
    {firstName: "Tina"}, 
    {firstName: "Gene"}, 
    {firstName: "Louise"}, 
    {firstName: "Kuchi-Kopi", _display: false}
  ]
}
```

&nbsp; *Outputs:*

```
Child: Tina
Child: Gene
Child: Louise
```

Finally, note that data within an array cannot be accessed outside of a section. However, the array itself will attempt to render if called as a variable.

&nbsp; *Template:*

```
1. {{children}}<br />
2. {{children.firstName}}<br />
3. {{children[0]}}
```

&nbsp; *Bindings:*

```javascript
{children: ["Tina", "Gene", "Louise"]}
```

&nbsp; *Outputs:*

```
1. [Tina,Gene,Louise]
2.
3.
```

&nbsp;

### Repeating list sections

Repeating sections may be combined with the list directive to grammatically format a list from the rendered pieces of the repeating section. The list directive must appear first -- i.e. `&#`.

&nbsp; *Template:*

```
{{name.first}}'s children are {{&#children}}{{.}}{{/children}}.
```

&nbsp; *Bindings:*

```javascript
{
  name: {
    first: "Bob", 
    last: "Belcher"
  }, 
  children: ["Tina", "Gene", "Louise"]
}
```

&nbsp; *Outputs:*

```
Bob's children are Tina, Gene, and Louise.
```


&nbsp;


## Nested Sections

Nested sections should behave as expected, even mixing regular versus repeating sections, as long as you properly manage the scope.

&nbsp; *Template:*

```
{{#children}}
  {{.name.first}} {{name.last}}'s hobbies include {{&.hobbies}}.<br />
{{/children}}
```

&nbsp; *Bindings:*

```javascript
{
  name: {
    first: "Bob", 
    last: "Belcher"
  }, 
  children: [
    {
      name: {first: "Tina"},
      hobbies: ["butts", "Equestranauts", "Boyz 4 Now"]
    }, 
    {
      name: {first: "Gene"},
      hobbies: ["music", "farts"]
    }, 
    {
      name: {first: "Louise"},
      hobbies: ["mischief"]
    }
  ]
}
```

&nbsp; *Outputs:*

```
Tina Belcher's hobbies include butts, Equestranauts, and Boyz 4 Now.
Gene Belcher's hobbies include music and farts.
Louise Belcher's hobbies include mischief.
```

For standard sections, nesting sections, even within itself, adds no major complication as sections are simply treated as on/off tags. However, when dealing with repeating sections or sections created with dynamic data (e.g. [mixing pass-to-function directing in a section tag](../advanced/#mixing-directives-in-a-section-tag)), the inner context will be specific to the directly nested section.

&nbsp; *Template:*

```
{{#n->increment}}
  {{#n->increment}}
    {{n}}
  {{/n}}
{{/n}}
-- {{n}}
```

&nbsp; *Bindings:*

```javascript
{
  n: 1,
  increment: function() { return this+1; }
}
```

&nbsp; *Outputs:*

```
3 -- 1
```

Note the first output is `3` due to being in two nested where the contexts are incremented. However, when `n` is called again outside the nesting, the value of `n` is unchanged outside of the previous contexts.

This gets particularly confusing with repeating contexts but makes sense when you consider the context changes instead each nested section.

&nbsp; *Template:*

```
{{#repeat}}
  {{#repeat}}
    {{.}}
  {{/repeat}}
{{/repeat}}
```

&nbsp; *Bindings:*

```javascript
{repeat: [1,2,3]} 
```

&nbsp; *Outputs:*

```
1 2 3
```

Your initial inclination might be to expect the output to be `1 2 3 1 2 3 1 2 3`. But consider that within the first `{{#repeat}}` section, the context of repeat has now changed to be the value of each item for each iteration. So in the second, nested section, the `{{#repeat}}` tag is simply a standard section tag (not a repeating section), as the value of repeat being passed each iteration is a single number.

----

&nbsp;

#### More

There are a few other things you can create with sections, such as mixing in directives in the section tag (briefly covered) or handling multi-dimensional arrays in repeating sections. For a run down of some these, read the section: [Advanced usage, edge cases, and general weirdness](../advanced/).
