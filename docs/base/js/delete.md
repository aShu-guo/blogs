# 深入分析delete <Badge type="info" text="翻译" />

几周前，我有机会浏览了 Stoyan Stefanov 的《面向对象的 Javascript》。这本书在亚马逊上的评价非常高（12 条评论，5 星），所以我很好奇它是否值得被推荐。我已经开始阅读有关函数的章节，并且非常喜欢其中解释事物的方式：良好、渐进的示例流程，似乎即使是初学者也能轻松掌握。然而，我几乎立刻就发现了贯穿整章的一个有趣的误解——`delete`。还有一些其他错误（例如函数声明和函数表达式之间的差异），但我们现在不讨论它们。

该书声称“函数被视为普通变量——它可以复制到不同的变量，甚至可以删除。” 。在这个解释之后，有这个例子：

```text
>>> var sum = function(a, b) {return a + b;}
>>> var add = sum;
>>> delete sum
true
>>> typeof sum;
"undefined"
```

忽略几个缺失的分号，您能看出这段代码有什么问题吗？当然，问题是删除sum变量不应该成功；delete语句不应返回“true”，`typeof sum`也不应返回“undefined”。这一切都是因为在 Javascript 中不可能删除变量。至少在以这种方式声明时不会。

那么这个例子中发生了什么？是拼写错误吗？转移注意力？可能不会。整个片段实际上是Firebug控制台的真实输出，Stoyan 一定使用了它来进行快速测试。Firebug 几乎就像遵循其他一些删除规则一样。是Firebug让Stoyan误入歧途！那么这里到底发生了什么？

要回答这个问题，我们需要了解delete运算符在 Javascript 中的工作原理：到底什么可以删除，什么不可以删除以及为什么。今天我将尝试详细解释这一点。我们将看一下 Firebug 的“奇怪”行为，并意识到它并不那么奇怪。

- 我们将深入研究声明变量、函数、分配属性和删除它们时背后发生的事情；
- 我们将研究浏览器的合规性和一些最臭名昭著的错误；
- 我们还将讨论 ECMAScript 第五版的严格模式，以及它如何改变delete运算符的行为。

毫不奇怪，delete在网络上的解释相当稀少。[MDN文章](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/delete)可能是最全面的资源，但遗憾的是遗漏了一些有关该主题的有趣细节；奇怪的是，这些被遗忘的事情之一就是 Firebug 的棘手行为的原因，[MDN文章](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/delete)实际上并没有提到。

## 理论

那么为什么我们可以删除对象属性：

```js
var o = { x: 1 };
delete o.x; // true
o.x; // undefined
```

但不是变量，声明如下：

```js
var x = 1;
delete x; // false
x; // 1
```

或函数，声明如下：

```js
function x() {}
delete x; // false
typeof x; // "function"
```

请注意，仅当属性无法删除delete时才返回false

为了理解这一点，我们需要首先掌握变量实例化和属性属性等概念——不幸的是，Javascript 书籍中很少涉及这些概念。我将在接下来的几段中尝试非常简洁地讨论这些内容。理解它们一点也不难！如果您不关心事情为何如此运作，请随意跳过本章。

### 代码类型

ECMAScript中有3种类型的可执行代码：`全局代码`、`函数代码`和`Eval代码`。这些类型在某种程度上具有自我描述性，但这里有一个简短的概述：

1. 当源文本被视为程序时，它在全局范围内执行，并被视为全局代码。在浏览器环境中，SCRIPT 元素的内容通常被解析为程序，因此被认为是全局代码。
2. 显然，任何直接在函数内执行的内容都被视为函数代码。在浏览器中，事件属性（`例如<p onclick="...">`）的内容通常被解析并视为函数代码。
3. 最后，提供给内置eval函数的文本被解析为Eval code。我们很快就会明白为什么这种类型很特别。

### 执行上下文

当 ECMAScript 代码执行时，它总是发生在特定的执行上下文中。执行上下文是一个有点抽象的实体，它有助于理解作用域和变量实例化的工作原理。对于三种类型的可执行代码中的每一种，都有一个执行上下文。当一个函数被执行时，就说控制进入了函数代码的执行上下文；当全局代码执行时，控制进入全局代码的执行上下文，依此类推。

正如你所看到的，执行上下文在逻辑上可以形成一个堆栈。首先，可能存在具有自己的执行上下文的全局代码；该代码可能会调用一个具有自己的执行上下文的函数；该函数可以调用另一个函数，依此类推。即使函数递归地调用自身，每次调用都会进入一个新的执行上下文。

激活对象/变量对象
每个执行上下文都有一个与其关联的所谓变量对象。与执行上下文类似，Variable对象是一个抽象实体，是描述变量实例化的机制。现在，有趣的部分是源文本中声明的变量和函数实际上被添加为此 Variable 对象的属性。

当控制进入全局代码的执行上下文时，全局对象将用作变量对象。这正是全局声明的变量或函数成为 Global 对象的属性的原因：

/_ remember that `this` refers to global object when in global scope _/
var GLOBAL_OBJECT = this;

var foo = 1;
GLOBAL_OBJECT.foo; // 1
foo === GLOBAL_OBJECT.foo; // true

function bar(){}
typeof GLOBAL_OBJECT.bar; // "function"
GLOBAL_OBJECT.bar === bar; // true
好的，全局变量成为 Global 对象的属性，但是局部变量（在函数代码中声明的变量）会发生什么情况？行为实际上非常相似：它们成为 Variable 对象的属性。唯一的区别是，在 Function 代码中， Variable 对象不是 Global 对象，而是所谓的Activation 对象。每次进入函数代码的执行上下文时都会创建激活对象。

Function 代码中声明的变量和函数不仅成为 Activation 对象的属性；每个函数参数（在与形式参数相对应的名称下）和一个特殊Arguments对象（在arguments名称下）也会发生这种情况。请注意，激活对象是一种内部机制，程序代码永远无法真正访问它。

(function(foo){

    var bar = 2;
    function baz(){}

    /*
    In abstract terms,

    Special `arguments` object becomes a property of containing function's Activation object:
      ACTIVATION_OBJECT.arguments; // Arguments object

    ...as well as argument `foo`:
      ACTIVATION_OBJECT.foo; // 1

    ...as well as variable `bar`:
      ACTIVATION_OBJECT.bar; // 2

    ...as well as function declared locally:
      typeof ACTIVATION_OBJECT.baz; // "function"
    */

})(1);
最后，在 Eval 代码中声明的变量被创建为调用上下文的 Variable 对象的属性。Eval 代码仅使用在其中调用它的执行上下文的 Variable 对象：

var GLOBAL_OBJECT = this;

/_ `foo` is created as a property of calling context Variable object,
which in this case is a Global object _/

eval('var foo = 1;');
GLOBAL_OBJECT.foo; // 1

(function(){

    /* `bar` is created as a property of calling context Variable object,
      which in this case is an Activation object of containing function */

    eval('var bar = 1;');

    /*
      In abstract terms,
      ACTIVATION_OBJECT.bar; // 1
    */

})();
属性属性
我们就快到了。现在已经清楚变量会发生什么（它们变成属性），唯一需要理解的剩余概念是属性属性。每个属性可以具有以下集合中的零个或多个属性 - ReadOnly、DontEnum、DontDelete和Internal。您可以将它们视为标志- 属性可以存在于属性上，也可以不存在。出于今天讨论的目的，我们只对 DontDelete 感兴趣。

当声明的变量和函数成为变量对象的属性时——无论是激活对象（对于函数代码）还是全局对象（对于全局代码），这些属性都是使用 DontDelete 属性创建的。但是，任何显式（或隐式）属性分配都会创建没有 DontDelete attribute 的属性。这本质上就是为什么我们可以删除一些属性，但不能删除其他属性：

var GLOBAL_OBJECT = this;

/_ `foo` is a property of a Global object.
It is created via variable declaration and so has DontDelete attribute.
This is why it can not be deleted. _/

var foo = 1;
delete foo; // false
typeof foo; // "number"

/_ `bar` is a property of a Global object.
It is created via function declaration and so has DontDelete attribute.
This is why it can not be deleted either. _/

function bar(){}
delete bar; // false
typeof bar; // "function"

/_ `baz` is also a property of a Global object.
However, it is created via property assignment and so has no DontDelete attribute.
This is why it can be deleted. _/

GLOBAL_OBJECT.baz = 'blah';
delete GLOBAL_OBJECT.baz; // true
typeof GLOBAL_OBJECT.baz; // "undefined"
内置和不可删除
这就是它的全部内容：属性上的一个特殊属性，控制该属性是否可以删除。请注意，内置对象的某些属性被指定为 DontDelete，因此无法删除。特殊arguments变量（或者，正如我们现在所知，Activation 对象的属性）具有 DontDelete。length任何函数实例的属性也具有 DontDelete：

(function(){

    /* can't delete `arguments`, since it has DontDelete */

    delete arguments; // false
    typeof arguments; // "object"

    /* can't delete function's `length`; it also has DontDelete */

    function f(){}
    delete f.length; // false
    typeof f.length; // "number"

})();
与函数参数对应的属性也是使用 DontDelete 创建的，因此也无法删除：

(function(foo, bar){

    delete foo; // false
    foo; // 1

    delete bar; // false
    bar; // 'blah'

})(1, 'blah');
未申报的任务
您可能还记得，未声明的赋值会在全局对象上创建一个属性。除非该属性是在全局对象之前的作用域链中的某个位置找到的。现在我们知道了属性赋值和变量声明之间的区别——后者设置了 DontDelete，而前一个则没有——应该很清楚为什么未声明的赋值会创建一个可删除的属性：

var GLOBAL_OBJECT = this;

/_ create global property via variable declaration; property has DontDelete _/
var foo = 1;

/_ create global property via undeclared assignment; property has no DontDelete _/
bar = 2;

delete foo; // false
typeof foo; // "number"

delete bar; // true
typeof bar; // "undefined"
请注意，属性是在属性创建期间确定的（即没有设置）。后续分配不会修改现有属性的属性。理解这种区别很重要。

/_ `foo` is created as a property with DontDelete _/
function foo(){}

/_ Later assignments do not modify attributes. DontDelete is still there! _/
foo = 1;
delete foo; // false
typeof foo; // "number"

/_ But assigning to a property that doesn't exist,
creates that property with empty attributes (and so without DontDelete) _/

this.bar = 1;
delete bar; // true
typeof bar; // "undefined"
萤火虫混乱
那么 Firebug 中会发生什么呢？为什么控制台中声明的变量可以被删除，这与我们刚刚学到的相反？嗯，正如我之前所说，Eval 代码在变量声明方面有一种特殊的行为。在 Eval 代码中声明的变量实际上是在没有 DontDelete 的情况下创建为属性：

eval('var foo = 1;');
foo; // 1
delete foo; // true
typeof foo; // "undefined"
同样，在函数代码中调用时：

(function(){

    eval('var foo = 1;');
    foo; // 1
    delete foo; // true
    typeof foo; // "undefined"

})();
这就是Firebug异常行为的要旨。控制台中的所有文本似乎都作为 Eval 代码解析和执行，而不是作为全局或函数代码。显然，任何声明的变量最终都会作为属性而无需 DontDelete，因此可以轻松删除。请注意常规全局代码和 Firebug 控制台之间的这些差异。

通过eval删除变量
这种有趣的eval行为与 ECMAScript 的另一个方面相结合，从技术上讲可以允许我们删除不可删除的属性。关于函数声明的问题是它们可以在同一执行上下文中覆盖同名变量：

function x(){ }
var x;
typeof x; // "function"
请注意函数声明如何优先并覆盖同名变量（或者换句话说，Variable 对象的相同属性）。这是因为函数声明是在变量声明之后实例化的，并且允许覆盖它们。函数声明不仅替换属性的先前值，还替换该属性的 attribute。如果我们通过 via 声明函数eval，该函数也应该用它自己的属性替换该属性的属性。由于从内部声明的变量eval创建没有 DontDelete 的属性，因此实例化这个新函数实际上应该从相关属性中删除现有的 DontDelete 属性，从而使该属性可删除（当然还可以更改其值以引用新创建的函数）。

var x = 1;

/_ Can't delete, `x` has DontDelete _/

delete x; // false
typeof x; // "number"

eval('function x(){}');

/_ `x` property now references function, and should have no DontDelete _/

typeof x; // "function"
delete x; // should be `true`
typeof x; // should be "undefined"
不幸的是，这种欺骗在我尝试过的任何实现中都不起作用。我可能在这里遗漏了一些东西，或者这种行为可能对于实现者来说太晦涩难懂而无法注意到。

浏览器合规性
了解事物在理论上是如何运作的很有用，但实际意义才是最重要的。浏览器在变量/属性创建/删除方面是否遵循标准？多半是对的。

我编写了一个简单的测试套件来检查运算符是否delete符合全局代码、函数代码和评估代码。测试套件检查两者 - 运算符的返回值delete，以及属性是否按预期删除（或未删除）。delete返回值并不像其实际结果那么重要。delete如果返回true而不是，这并不是很重要false，但重要的是，具有 DontDelete 的属性不会被删除，反之亦然。

现代浏览器通常非常兼容。除了我之前提到的这个eval特性之外，以下浏览器完全通过了测试套件：Opera 7.54+、Firefox 1.0+、Safari 3.1.2+、Chrome 4+。

Safari 2.x 和 3.0.4 在删除函数参数时存在问题；这些属性似乎是在没有 DontDelete 的情况下创建的，因此可以删除它们。Safari 2.x 存在更多问题 — 删除非引用（例如delete 1）会引发错误；函数声明创建可删除的属性（但奇怪的是，不是变量声明）；变量声明eval变得不可删除（但函数声明除外）。

与 Safari 类似，Konqueror（3.5，但不是 4.3）在删除非引用（例如delete 1）时会抛出错误，并错误地使函数参数可删除。

Gecko 不要删除错误
Gecko 1.8.x 浏览器 - Firefox 2.x、Camino 1.x、Seamonkey 1.x 等 - 表现出一个有趣的错误，即显式分配给属性可以删除其 DontDelete 属性，即使该属性是通过变量或函数创建的宣言：

function foo(){}
delete foo; // false (as expected)
typeof foo; // "function" (as expected)

/_ now assign to a property explicitly _/

this.foo = 1; // erroneously clears DontDelete attribute
delete foo; // true
typeof foo; // "undefined"

/_ note that this doesn't happen when assigning property implicitly _/

function bar(){}
bar = 1;
delete bar; // false
typeof bar; // "number" (although assignment replaced property)
令人惊讶的是，Internet Explorer 5.5 - 8 完全通过了测试套件，除了删除非引用（例如delete 1）会引发错误（就像旧版 Safari 中一样）。但实际上IE 中还有更严重的错误，但这些错误并没有立即显现出来。这些错误与全局对象有关。

IE 错误
整个章节只是为了解决 Internet Explorer 中的错误？多么出乎意料啊！

在 IE（至少 6-8）中，以下表达式会抛出错误（在全局代码中计算时）：

this.x = 1;
delete x; // TypeError: Object doesn't support this action
还有这个，但有不同的例外，只是为了让事情变得有趣：

var x = 1;
delete this.x; // TypeError: Cannot delete 'this.x'
这就好像全局代码中的变量声明不会在IE 中的全局对象上创建属性。通过赋值 ( ) 创建属性this.x = 1，然后通过delete x抛出错误删除它。通过声明 ( ) 创建属性var x = 1，然后通过删除它delete this.x会引发另一个错误。

但这还不是全部。通过显式赋值创建属性实际上总是会在删除时引发错误。不仅存在错误，而且创建的属性似乎设置了 DontDelete，这当然不应该设置：

this.x = 1;

delete this.x; // TypeError: Object doesn't support this action
typeof x; // "number" (still exists, wasn't deleted as it should have been!)

delete x; // TypeError: Object doesn't support this action
typeof x; // "number" (wasn't deleted again)
现在，与人们的想法相反，未声明的赋值（那些应该在全局对象上创建属性的赋值）确实会在 IE 中创建可删除的属性：

x = 1;
delete x; // true
typeof x; // "undefined"
this但是，如果您尝试通过全局代码 ( )引用此类属性来删除该属性delete this.x，则会弹出一个熟悉的错误：

x = 1;
delete this.x; // TypeError: Cannot delete 'this.x'
如果我们要概括这种行为，那么delete this.x从全局代码内部来看似乎永远不会成功。当通过显式赋值 ( ) 创建相关属性时this.x = 1，delete会抛出一个错误；x = 1当通过未声明的赋值 ( ) 或通过声明 ( )创建属性时var x = 1，delete会引发另一个错误。

delete x另一方面，仅当通过显式赋值创建相关属性时才会抛出错误 - this.x = 1。如果属性是通过声明 ( var x = 1) 创建的，则删除根本不会发生并delete正确返回false。如果属性是通过未声明的赋值 ( x = 1) 创建的，则删除将按预期进行。

早在 9 月份我就在思考这个问题，Garrett Smith建议在 IE 中“将全局变量对象实现为 JScript 对象，全局对象由主机实现。Garrett 使用了Eric Lippert 的博客文章作为参考。我们可以通过执行一些测试来在一定程度上证实这一理论。请注意 和this似乎window如何引用相同的对象（如果我们可以相信===运算符），但变量对象（声明函数的对象）与任何this引用都不同。

/_ in Global code _/

```js
function getBase() {
  return this;
}

getBase() === this.getBase(); // false
this.getBase() === this.getBase(); // true
window.getBase() === this.getBase(); // true
window.getBase() === getBase(); // false
```

误解
理解事物为何如此运作的美妙之处不可低估。我在网上看到了一些与delete操作员误解相关的误解。例如，Stackoverflow 上有一个答案（具有令人惊讶的高评级），自信地解释了如何“当目标不是对象属性时删除应该是无操作”。现在我们了解了行为的核心delete，很明显这个答案是相当不准确的。delete不区分变量和属性（事实上， for delete，这些都是引用）并且实际上只关心 DontDelete 属性（和属性存在）。

看到误解如何相互反弹也很有趣，在同一个线程中，有人首先建议只删除变量（除非从内部声明，否则它将不起作用eval），而另一个人提供了错误的更正如何可以删除全局代码中的变量，但不删除函数一中的变量。

请小心网络上的 Javascript 解释，理想情况下，始终寻求理解问题的核心；）

‘删除’和宿主对象
的算法delete大致如下：

如果操作数不是引用，则返回true
如果对象没有具有该名称的直接属性，则返回true（其中，正如我们现在所知，对象可以是激活对象或全局对象）
如果属性存在但具有 DontDelete，则返回false
否则，移除财产并归还true
然而，delete操作员与宿主对象的行为可能相当不可预测。实际上这并没有什么问题：主机对象（根据规范）允许实现任何类型的操作行为，例如读取（内部 [[Get]] 方法）、写入（内部 [[Put]] 方法）或删除（内部 [[Delete]] 方法），等等。这种对自定义[[Delete]]行为的允许使得宿主对象变得如此混乱。

我们已经看到了一些 IE 的奇怪现象，即删除某些对象（显然是作为宿主对象实现的）会引发错误。某些版本的 Firefox 在尝试删除window.location. 当涉及到宿主对象时，你也不能相信delete的返回值；看看 Firefox 中发生了什么：

/_ "alert" is a direct property of `window` (if we were to believe `hasOwnProperty`) _/
window.hasOwnProperty('alert'); // true

delete window.alert; // true
typeof window.alert; // "function"
删除window.alertreturns true，即使该属性没有任何内容会导致这样的结果。它解析为引用（因此无法返回true第一步）。它是对象的直接属性window（因此无法true在第二步中返回）。唯一delete可以返回的方法true是在到达步骤 4 并实际删除属性后。然而，财产永远不会被删除。

这个故事的寓意是永远不要相信宿主对象。

作为奖励，这是 IE 中另一种奇怪的删除行为的情况：

var element = document.createElement('div')
delete element.onclick; // throws "Object doesn't support this action"

document.body.x = 1;
delete document.body.x; // throws "Object doesn't support this action"

// in IE8
delete XMLHttpRequest.prototype.open; // throws "Object doesn't support this action"
ES5 严格模式
那么ECMAScript 第五版的严格模式带来了什么？引入的限制很少。现在，当运算符中的表达式delete是对变量、函数参数或函数标识符的直接引用时，会引发语法错误。此外，如果属性具有内部 [[Configurable]] == false，则会引发 TypeError：

(function(foo){

"use strict"; // enable strict mode within this function

var bar;
function baz(){}

delete foo; // SyntaxError (when deleting argument)
delete bar; // SyntaxError (when deleting variable)
delete baz; // SyntaxError (when deleting variable created with function declaration)

/_ `length` of function instances has { [[Configurable]] : false } _/

delete (function(){}).length; // TypeError

})();
此外，删除未声明的变量（或者换句话说，未解析的引用）也会抛出 SyntaxError ：

"use strict";
delete i_dont_exist; // SyntaxError
这有点类似于严格模式下未声明赋值的行为方式（除了抛出 ReferenceError 而不是 SyntaxError）：

"use strict";
i_dont_exist = 1; // ReferenceError
正如您现在所了解的，考虑到删除变量、函数声明和参数会造成多少混乱，所有这些限制都有些道理。严格模式不是默默地忽略删除，而是采取更加积极和描述性的措施。

概括
这篇文章相当冗长，所以我不会谈论诸如删除数组项之类的事情delete以及它的含义。您可以随时参考 MDC 文章以获取特定说明（或阅读规范并自行实验）。

以下是 Javascript 中删除工作原理的简短摘要：

变量和函数声明是 Activation 或 Global 对象的属性。
属性具有属性，其中之一 — DontDelete — 负责确定属性是否可以被删除。
全局和函数代码中的变量和函数声明始终使用 DontDelete创建属性。
函数参数也是 Activation 对象的属性，并使用 DontDelete创建。
Eval 代码中的变量和函数声明始终创建不带 DontDelete 的属性。
新属性总是使用空属性创建（因此没有 DontDelete）。
宿主对象可以按照自己的意愿对删除做出反应。
如果您想更熟悉此处描述的内容，请参阅ECMA-262 第 3 版规范。

我希望您喜欢这篇概述并学到一些新东西。一如既往地欢迎任何问题、建议和更正

参考：

【1】[understanding-delete](http://perfectionkills.com/understanding-delete/)

【2】[delete 运算符](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/delete)
