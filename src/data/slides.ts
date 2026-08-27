export const slides = [
  {
    id: "slide-0",
    title: "MAT-3001: Course Structure & Evaluation",
    content: `
**Course Structure (3 modules x 5 weeks)**
1. Applied Math &nbsp; | &nbsp; 2. Algebra &nbsp; | &nbsp; 3. Statistics
*Each module: **3 weeks lectures** + **2 weeks project work**.*

**Project Deliveries & Feedback**
A first draft of the module project must be submitted by the end of the 2-week project period to receive feedback.

**Mandatory Oral Presentation**
- You will present and be examined on one of your module projects. 
- Teachers assign the project to you ~1 week prior.
- Must be completed and approved by **November 27**.

**Final Evaluation (Portfolio)**
- Submit a final portfolio with all polished projects by **December 18**.
- Graded as **Pass / Fail** by an external examiner.
    `
  },
  {
    id: "slide-1",
    title: "1. Generalized Extremal Problems",
    content: `
Extremal problems, like minimum and maximum problems, have played a major role in the development of calculus. In fact, calculus was more or less invented to solve such problems.

In the language of calculus, the quantity we need to maximize or minimize is a function of a real variable, $x$, and the challenge is to find an $x_0$ such that

$$
f(x) \\le f(x_0) \\quad \\text{or} \\quad f(x) \\ge f(x_0) \\qquad \\forall x \\neq x_0
$$

If $f(x)$ is a well behaved function, calculus tells us that we only need to look at points $x^*$ such that

$$
f'(x^*) = 0
$$

All maximum and minimum points will be found among the set of points that satisfy this condition. There are however many important extremal problems that do not fall into the category described above. In fact, some of these problems are much older than calculus itself, like the **isoperimetric problem** stated already 200 BCE by Zenodorus.
    `
  },
  {
    id: "slide-2",
    title: "1.1 Curve of shortest length in a plane",
    content: `
Let $p$ and $q$ be two points on the plane. The challenge is to find a curve, $C$, connecting $p$ and $q$, which is of shortest possible length.

In order to state the problem in precise mathematical terms, we introduce a parametrization $\\gamma(t)$ for $C$:

$$
\\begin{aligned}
\\gamma(t) &= (x(t), y(t)), \\quad 0 \\le t \\le 1 \\\\
\\gamma([0, 1]) &= C \\\\
\\gamma(0) &= p, \\quad \\gamma(1) = q
\\end{aligned}
$$

Using this parametrization, the length of the curve, $L(C)$, can be written as

$$
L(C) = \\int_0^1 dt \\|\\gamma'(t)\\| = \\int_0^1 dt \\sqrt{x'(t)^2 + y'(t)^2}
$$

The challenge is then to find a curve, $C_0$, such that $L(C) \\ge L(C_0)$ for all $C$ connecting $p$ and $q$. The only difference from elementary calculus is that $L$ is not a function of a real variable, but is rather a function defined on the set of smooth curves connecting the points $p$ and $q$. Such a function is called a **functional**.
    `
  },
  {
    id: "slide-2-1",
    title: "1.1 Curve of shortest length in a plane (Variational Approach)",
    content: `
Let us try to solve the shortest path problem from scratch, to get a feel for how the calculus of variations works before we introduce the general theory. We want to minimize the length functional:

$$
L(C) = \\int_0^1 dt \\sqrt{x'(t)^2 + y'(t)^2}
$$

Let's assume $\\gamma(t) = (x(t), y(t))$ is the optimal curve. What happens if we perturb it slightly? We introduce a small variation using arbitrary smooth functions $\\eta_1(t)$ and $\\eta_2(t)$ that vanish at the endpoints (since the start and end points $p$ and $q$ are fixed):

$$
x(t) \\to x(t) + \\epsilon \\eta_1(t) \\qquad y(t) \\to y(t) + \\epsilon \\eta_2(t)
$$

The length of this perturbed curve is a function of the small parameter $\\epsilon$:

$$
L(\\epsilon) = \\int_0^1 dt \\sqrt{(x' + \\epsilon \\eta_1')^2 + (y' + \\epsilon \\eta_2')^2}
$$

For $\\gamma(t)$ to be the shortest path, $L(\\epsilon)$ must have a minimum at $\\epsilon = 0$. Thus, its derivative with respect to $\\epsilon$ evaluated at $0$ must be zero:

$$
\\left. \\frac{dL}{d\\epsilon} \\right|_{\\epsilon=0} = \\int_0^1 dt \\frac{x' \\eta_1' + y' \\eta_2'}{\\sqrt{x'^2 + y'^2}} = 0
$$

Using integration by parts on each term, and noting that the boundary terms vanish because $\\eta_1(0) = \\eta_1(1) = 0$ (and similarly for $\\eta_2$), we get:

$$
-\\int_0^1 dt \\left[ \\frac{d}{dt}\\left( \\frac{x'}{\\sqrt{x'^2 + y'^2}} \\right) \\eta_1 + \\frac{d}{dt}\\left( \\frac{y'}{\\sqrt{x'^2 + y'^2}} \\right) \\eta_2 \\right] = 0
$$

Since $\\eta_1(t)$ and $\\eta_2(t)$ are completely arbitrary, the expressions inside the brackets must be identically zero for all $t$. This gives us our differential equations:

$$
\\frac{d}{dt}\\left( \\frac{x'}{\\sqrt{x'^2 + y'^2}} \\right) = 0 \\quad \\text{and} \\quad \\frac{d}{dt}\\left( \\frac{y'}{\\sqrt{x'^2 + y'^2}} \\right) = 0
$$

This means $\\frac{x'}{\\sqrt{x'^2 + y'^2}} = c_1$ and $\\frac{y'}{\\sqrt{x'^2 + y'^2}} = c_2$. Dividing these two constants gives $\\frac{y'}{x'} = \\frac{dy}{dx} = \\frac{c_2}{c_1}$. 

A curve with a constant slope $\\frac{dy}{dx}$ is a **straight line**! We have just proven that the shortest path between two points is a straight line using the core idea of variational calculus.

![Shortest curve in a plane](/plane_shortest.svg)
    `
  },
  {
    id: "slide-3",
    title: "1.2 Curve of shortest length on a surface",
    content: `
Let $S$ be a surface in $\\mathbb{R}^3$ and let $p$ and $q$ be points on $S$. The challenge is to find a curve, $C$, on the surface $S$, connecting $p$ and $q$, which is of the shortest possible length.

Let $\\gamma(t)$ be a parametrization for $C$:

$$
\\begin{aligned}
\\gamma(t) &= (x(t), y(t), z(t)) \\quad 0 \\le t \\le 1 \\\\
\\gamma([0, 1]) &= C \\subset S \\\\
\\gamma(0) &= p, \\quad \\gamma(1) = q
\\end{aligned}
$$

The length of $C$ is

$$
L(C) = \\int_0^1 dt \\sqrt{x'(t)^2 + y'(t)^2 + z'(t)^2}
$$

and the challenge is to find a curve $C_0$ such that $L(C) \\ge L(C_0)$ for all $C \\subset S$ connecting $p$ and $q$. This looks exactly like an extremal problem from regular calculus where we have a constraint. By parametrizing the surface with vectors $\\mathbf{T}_u$ and $\\mathbf{T}_v$, we find the length functional involves metric coefficients $A, B, C$ that determine the geometry of the surface $S$. The curve of minimal length is called a **geodesics** for the surface.
    `
  },
  {
    id: "slide-3-1",
    title: "1.2 Example: Shortest curve on a Cylinder",
    content: `
Let us try to apply the variational method to a specific surface. A simple yet illuminating choice is a **cylinder** of constant radius $R$. 

We can parameterize the cylinder using an angle $\\theta$ and a height $z$. Any point on the cylinder is given by $\\mathbf{x}(\\theta, z) = (R \\cos\\theta, R \\sin\\theta, z)$. A curve on this surface is defined by $\\gamma(t) = (\\theta(t), z(t))$.

The length of such a curve is:
$$
L = \\int_0^1 dt \\sqrt{R^2 \\theta'(t)^2 + z'(t)^2}
$$

To find the shortest curve (the geodesic), we perturb the path: $\\theta(t) \\to \\theta(t) + \\epsilon \\eta_1(t)$ and $z(t) \\to z(t) + \\epsilon \\eta_2(t)$. 

Just like in the plane example, we evaluate $\\left. \\frac{dL}{d\\epsilon} \\right|_{\\epsilon=0} = 0$:
$$
\\int_0^1 dt \\frac{R^2 \\theta' \\eta_1' + z' \\eta_2'}{\\sqrt{R^2 \\theta'^2 + z'^2}} = 0
$$

Applying integration by parts and using the fact that $\\eta_1$ and $\\eta_2$ vanish at the boundaries, we obtain:
$$
-\\int_0^1 dt \\left[ \\frac{d}{dt}\\left( \\frac{R^2 \\theta'}{\\sqrt{R^2 \\theta'^2 + z'^2}} \\right) \\eta_1 + \\frac{d}{dt}\\left( \\frac{z'}{\\sqrt{R^2 \\theta'^2 + z'^2}} \\right) \\eta_2 \\right] = 0
$$

Since the variations are arbitrary, both brackets must be zero:
$$
\\frac{R^2 \\theta'}{\\sqrt{R^2 \\theta'^2 + z'^2}} = c_1 \\quad \\text{and} \\quad \\frac{z'}{\\sqrt{R^2 \\theta'^2 + z'^2}} = c_2
$$

Dividing the second equation by the first gives us the slope of the curve in the $(\\theta, z)$ plane:
$$
\\frac{z'}{\\theta'} = \\frac{dz}{d\\theta} = \\frac{c_2}{c_1} R^2 = k
$$

Integrating this yields $z(\\theta) = k\\theta + c$. This equation describes a **helix**! So the shortest path on a cylinder is a helix (which looks like a straight line if you were to cut the cylinder open and lay it flat).

![Shortest curve on a cylinder](/cylinder_shortest.svg)
    `
  },
  {
    id: "slide-3-2",
    title: "1.2.1 Primer: Lagrange Multipliers",
    content: `
Before we tackle our next challenge, we need a mathematical tool to handle **constraints**. 

Suppose we want to maximize a regular function $f(x, y)$ subject to a strict constraint $g(x, y) = c$. Instead of trying to solve the constraint equation for one variable and substituting it into the other (which is often very hard or impossible), we introduce a new, artificial variable $\\lambda$ called a **Lagrange Multiplier**. 

We then define a new, combined function:
$$ 
h(x, y, \\lambda) = f(x, y) + \\lambda(g(x, y) - c) 
$$

By finding the *unconstrained* stationary points of $h$ (where all partial derivatives are zero), we automatically find the *constrained* stationary points of $f$! This works because setting the derivative with respect to $\\lambda$ to zero simply enforces our original constraint:
$$
\\frac{\\partial h}{\\partial \\lambda} = g(x, y) - c = 0 \\implies g(x, y) = c
$$

This same brilliant idea can be extended to the calculus of variations: if we want to maximize a functional $A$ subject to a constraint $L = L^*$, we simply look for stationary points of the combined functional $K = A + \\lambda L$. 

Let's see this powerful trick in action on a 2000-year-old math problem!
    `
  },
  {
    id: "slide-3-3",
    title: "1.2.2 Primer: Green's Theorem",
    content: `
Recall **Green's Theorem** from vector calculus, which elegantly connects a 2D integral over a flat region $D$ to a 1D line integral around its boundary $C$:

$$
\\iint_D \\left( \\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y} \\right) dx dy = \\oint_C (P dx + Q dy)
$$

This theorem is our secret weapon if we want to calculate the **Area** of a region. By definition, the area is simply $\\iint_D 1 \\, dx dy$. 

If we choose a clever vector field $\\mathbf{F} = (P, Q)$ such that $\\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y} = 1$, we can calculate the entire area just by walking along the boundary! 

A standard and symmetrical choice is $P = -\\frac{1}{2}y$ and $Q = \\frac{1}{2}x$. Let's verify: $\\frac{1}{2} - (-\\frac{1}{2}) = 1$. 

Therefore, the area of any region enclosed by a curve $C$ can be written as:
$$
A = \\frac{1}{2} \\oint_C (x \\, dy - y \\, dx)
$$

We will use this exact trick to set up our next problem!
    `
  },
  {
    id: "slide-4",
    title: "1.3 The isoperimetric problem",
    content: `
Let us consider the truly ancient isoperimetric problem. Let $C$ be a curve enclosing a domain $D$. We want to express the area of $D$ in terms of $C$, and for this purpose introduce a vector field $\\mathbf{f}$ on the plane given by $\\mathbf{f}(x, y) = \\frac{1}{2}(x, y)$.

Using the divergence form of Green's theorem, the area of $D$ is a functional of $C$:

$$
A = A(C) = \\oint_C dl \\, \\mathbf{f} \\cdot \\mathbf{n}
$$

The length of the curve $C$ is determined by the functional:

$$
L = L(C) = \\oint_C dl
$$

The isoperimetric problem consists of finding the curve $C_0$ that maximizes $A(C)$ for a fixed length $L(C) = L^*$. By parametrizing the curve, we obtain the functional to maximize:

$$
A(C) = \\frac{1}{2} \\int_0^1 dt \\, (x(t) y'(t) - y(t) x'(t))
$$

subject to the constraint $\\int_0^1 dt \\sqrt{x'(t)^2 + y'(t)^2} = L^*$.
    `
  },
  {
    id: "slide-4-1",
    title: "1.3 Example: The Isoperimetric Problem (Variational Approach)",
    content: `
Since we haven't introduced the general theory yet, let us solve this problem directly by perturbing the curve, just like we did for the shortest path!

We want to maximize the Area $A$ subject to a fixed Length $L = L^*$. We handle the constraint by introducing a **Lagrange multiplier** $\\lambda$ and looking for the stationary point of the combined functional $K = A + \\lambda L$:

$$
K = \\int_0^1 dt \\left[ \\frac{1}{2}(x y' - y x') + \\lambda \\sqrt{x'^2 + y'^2} \\right]
$$

Let's perturb the curve: $x \\to x + \\epsilon \\eta_1$ and $y \\to y + \\epsilon \\eta_2$. 

First, the variation of the area $\\left. \\frac{dA}{d\\epsilon} \\right|_{\\epsilon=0}$ gives:
$$
\\frac{1}{2} \\int_0^1 dt \\left( x \\eta_2' + \\eta_1 y' - y \\eta_1' - \\eta_2 x' \\right)
$$
Using integration by parts on the terms with $\\eta'$ (e.g., $\\int x \\eta_2' dt = -\\int x' \\eta_2 dt$), this simplifies beautifully to:
$$
\\delta A = \\int_0^1 dt \\left( y' \\eta_1 - x' \\eta_2 \\right)
$$

Next, the variation of the length $\\delta L$ is exactly what we calculated in example 1.1:
$$
\\delta L = -\\int_0^1 dt \\left[ \\frac{d}{dt}\\left( \\frac{x'}{\\sqrt{x'^2 + y'^2}} \\right) \\eta_1 + \\frac{d}{dt}\\left( \\frac{y'}{\\sqrt{x'^2 + y'^2}} \\right) \\eta_2 \\right]
$$

For $K$ to be stationary, $\\delta A + \\lambda \\delta L = 0$. Since $\\eta_1$ and $\\eta_2$ are completely arbitrary, the coefficients in front of them must be zero:

$$
y' - \\lambda \\frac{d}{dt}\\left( \\frac{x'}{\\sqrt{x'^2 + y'^2}} \\right) = 0 \\quad \\text{and} \\quad -x' - \\lambda \\frac{d}{dt}\\left( \\frac{y'}{\\sqrt{x'^2 + y'^2}} \\right) = 0
$$

We can integrate both of these equations directly with respect to $t$ (introducing integration constants $c_1$ and $c_2$):

$$
y - c_1 = \\lambda \\frac{x'}{\\sqrt{x'^2 + y'^2}} \\quad \\text{and} \\quad -(x - c_2) = \\lambda \\frac{y'}{\\sqrt{x'^2 + y'^2}}
$$

If we square both equations and add them together, the derivatives vanish completely since $\\frac{x'^2 + y'^2}{x'^2 + y'^2} = 1$:

$$
(x - c_2)^2 + (y - c_1)^2 = \\lambda^2
$$

This is the standard equation for a **circle** with center $(c_2, c_1)$ and radius $\\lambda$. The isoperimetric problem is solved directly from scratch: the curve that maximizes the area for a fixed perimeter is always a circle!

![The Isoperimetric Problem](/isoperimetric.svg)
    `
  },
  {
    id: "slide-5",
    title: "1.4 & 1.5 Minimal surfaces",
    content: `
**1.4 Surface of revolution of minimal area**

Let $y(x)$ be a function defined on the interval $(x_1, x_2)$ with $y(x) > 0$. The area of the surface of revolution we get by rotating the curve $y(x)$ around the x-axis is:

$$
A(y) = 2\\pi \\int_{x_1}^{x_2} dx \\, y(x) \\sqrt{1 + y'(x)^2}
$$

The challenge is to find a curve $y(x)$ for which $A(y)$ is minimal given fixed endpoints.

**1.5 General surface of minimal area**

Let a curve $C$ in $\\mathbb{R}^3$ be given. The challenge is to find a surface $S \\subset \\mathbb{R}^3$ such that its boundary $\\partial S = C$ and its area $A(S)$ is minimal. Such a surface is called a **minimal surface**, similar to the shape a soap film forms when clinging to a wire frame. 

Parametrizing the surface, the area is given by the formula:

$$
A(S) = \\iint_D du \\, dv \\, \\|\\mathbf{T}_u \\times \\mathbf{T}_v\\|
$$
    `
  },
  {
    id: "slide-6",
    title: "1.6 The Fermat Principle",
    content: `
Let $c$ be the speed of light in vacuum. The refractive index $n$ of a material is the ratio $n = c/v$, where $v$ is the speed of light in the medium. Unless the material is homogeneous, the refractive index depends on position, $n = n(\\mathbf{x})$.

The total time it takes light to propagate along a curve $\\Gamma$ is:

$$
T(\\Gamma) = \\frac{1}{c} \\int_\\Gamma dl \\, n
$$

**Fermat's principle** states that light follows the path through a medium of refractive index $n(\\mathbf{x})$, which takes the *shortest* possible time. Thus, in order to find the path followed by light, we must minimize $T(\\Gamma)$ over all paths $\\Gamma$.

Parametrizing this, we must find functions $x(t), y(t), z(t)$ that minimize:

$$
T(\\Gamma) = \\int_0^1 dt \\, n(x(t), y(t), z(t)) \\sqrt{x'(t)^2 + y'(t)^2 + z'(t)^2}
$$
    `
  },
  {
    id: "slide-7",
    title: "1.7 The brachistochrone problem",
    content: `
The brachistochrone (shortest time in Greek) problem asks to find the arc $(x, y(x))$ which a particle of mass $m$ must follow from $(x_1, y_1)$ to $(x_2, y_2)$, in order for it to use as little time as possible under a constant gravitational field.

Using conservation of energy, the velocity $v$ is related to the vertical drop. The time it takes the particle to move along the arc is:

$$
T(y) = \\int_{x_1}^{x_2} dx \\, \\frac{1}{v} \\sqrt{1 + y'(x)^2}
$$

By substituting $v$ from energy conservation ($v = \\sqrt{2g(y - y_0)}$), the challenge is to minimize:

$$
T(y) = \\frac{1}{\\sqrt{2g}} \\int_{x_1}^{x_2} dx \\sqrt{\\frac{1 + y'(x)^2}{y(x) - y_0}}
$$

subject to the endpoint constraints.
    `
  },
  {
    id: "slide-8",
    title: "1.8 The Action Principle",
    content: `
Let us consider a system consisting of $N$ mass-points with positions $\\mathbf{x}_i$, velocities $\\mathbf{x}'_i$, and masses $m_i$. Assuming conservative forces with potential $V(\\mathbf{x}_1, ..., \\mathbf{x}_N)$, the kinetic energy $T$ and the Lagrangian $L$ are defined as:

$$
L(\\mathbf{x}_1, ..., \\mathbf{x}_N, \\mathbf{x}'_1, ..., \\mathbf{x}'_N) = T - V
$$

Let a curve $\\mathbf{P}(t) = (\\mathbf{x}_1(t), ..., \\mathbf{x}_N(t))$ be given in the configuration space. The **action** of the curve is by definition:

$$
\\mathcal{S}(\\mathbf{P}) = \\int_{t_1}^{t_2} dt \\, L(\\mathbf{x}_1(t), ..., \\mathbf{x}_N(t), \\mathbf{x}'_1(t), ..., \\mathbf{x}'_N(t))
$$

The action principle (or Hamilton's principle) says that the path traced out in configuration space is the one that is *stationary* for the action. This principle is the single most important idea in theoretical physics, from which all fundamental physical models (classical and quantum) are derived.
    `
  },
  {
    id: "slide-9",
    title: "2. The Euler-Lagrange Equations",
    content: `
From the previous subsections, extremal problems for functionals play an important role in our description of nature. It is time to find a way to solve them.

Several of the examples involved a functional of the form:

$$
T(y) = \\int_{t_0}^{t_1} dt \\, L(t, y, y')
$$

with constraints $y(t_0) = y_0$ and $y(t_1) = y_1$. The integrand $L$ is called a **Lagrangian**.

We say that a functional $T$ is differentiable at $y$ if for $\\epsilon \\ll 1$ and a variation $\\eta(x)$, we have:

$$
T(y + \\epsilon \\eta) = T(y) + \\epsilon A(y, \\eta) + \\mathcal{O}(\\epsilon^2)
$$

The map $\\eta \\to A(y, \\eta)$ is the **variational derivative** $\\delta T(y)(\\eta)$. The function $y(t)$ is stationary for $T(y)$ if and only if $\\delta T(y)(\\eta) = 0$ for all valid variations $\\eta(x)$.
    `
  },
  {
    id: "slide-10",
    title: "2.1 One dependent variable",
    content: `
Let us calculate the variational derivative of the functional $T(y)$:

$$
\\begin{aligned}
T(y + \\epsilon \\eta) &= \\int_{t_0}^{t_1} dt \\, L(t, y + \\epsilon \\eta, y' + \\epsilon \\eta') \\\\
&= T(y) + \\epsilon \\int_{t_0}^{t_1} dt \\left\\{ \\frac{\\partial L}{\\partial y} \\eta + \\frac{\\partial L}{\\partial y'} \\eta' \\right\\} + \\mathcal{O}(\\epsilon^2)
\\end{aligned}
$$

Since the variation must satisfy the boundary conditions, $\\eta(t_0) = \\eta(t_1) = 0$. Using integration by parts on the second term:

$$
\\int_{t_0}^{t_1} dt \\, \\frac{\\partial L}{\\partial y'} \\eta' = \\left[ \\frac{\\partial L}{\\partial y'} \\eta \\right]_{t_0}^{t_1} - \\int_{t_0}^{t_1} dt \\, \\frac{d}{dt}\\left( \\frac{\\partial L}{\\partial y'} \\right) \\eta
$$

The boundary term vanishes. Thus, the condition for a stationary point becomes:

$$
\\int_{t_0}^{t_1} dt \\left\\{ \\frac{\\partial L}{\\partial y} - \\frac{d}{dt}\\left( \\frac{\\partial L}{\\partial y'} \\right) \\right\\} \\eta = 0 \\quad \\forall \\eta(t)
$$

By the **fundamental lemma of variational calculus**, the expression inside the brackets must be zero:

$$
\\frac{\\partial L}{\\partial y} - \\frac{d}{dt}\\left( \\frac{\\partial L}{\\partial y'} \\right) = 0
$$

This is the **Euler-Lagrange equation**.
    `
  },
  {
    id: "slide-11",
    title: "2.1 Example 1: Surface of revolution of minimal area",
    content: `
Let's find the Euler-Lagrange equation for the surface of revolution of minimal area (from section 1.4). The Lagrangian density is:

$$
\\mathcal{L} = 2\\pi y \\sqrt{1 + y'^2}
$$

Since $\\mathcal{L}$ does not explicitly depend on $x$, we can use the first integral (a consequence of Noether's theorem):

$$
y' \\frac{\\partial \\mathcal{L}}{\\partial y'} - \\mathcal{L} = c
$$

Substituting our $\\mathcal{L}$ into this identity gives:

$$
y' \\left( 2\\pi y \\frac{y'}{\\sqrt{1 + y'^2}} \\right) - 2\\pi y \\sqrt{1 + y'^2} = c
$$

Simplifying this expression leads to the differential equation:

$$
y' = \\pm \\sqrt{\\left(\\frac{y}{\\alpha}\\right)^2 - 1}
$$

This is a separable differential equation. The general solution is a **Catenary**:

$$
y(x) = \\alpha \\cosh\\left(\\frac{x}{\\alpha} + \\beta\\right)
$$
    `
  },
  {
    id: "slide-12",
    title: "2.1 Example 2: The Brachistochrone problem",
    content: `
Let's apply the same method to the Brachistochrone problem (from section 1.7). The Lagrangian density is:

$$
\\mathcal{L} = \\frac{1}{\\sqrt{2g}} (1 + y'^2)^{\\frac{1}{2}} (y - y_0)^{-\\frac{1}{2}}
$$

Again, $\\mathcal{L}$ does not explicitly depend on $x$. Using the first integral identity $y' \\frac{\\partial \\mathcal{L}}{\\partial y'} - \\mathcal{L} = c$ and simplifying, we get:

$$
c_1 (1 + y'^2)^{\\frac{1}{2}} (y - y_0)^{\\frac{1}{2}} = -1
$$

By squaring both sides and using a trigonometric substitution ($y - y_0 = \\alpha^2 \\sin^2 \\frac{\\theta}{2}$), we can solve this integral to find the parametric equations:

$$
x = \\frac{1}{2}\\alpha^2(\\theta - \\sin\\theta) - c
$$
$$
y = y_0 + \\frac{1}{2}\\alpha^2(1 - \\cos\\theta)
$$

This is the parametric representation of a **cycloid**, which gives the path of shortest time!
    `
  },
  {
    id: "slide-12-1",
    title: "2.1.1 The Action Principle and Newton's Second Law",
    content: `
Earlier, we briefly mentioned the **Action Principle** (or Hamilton's principle), which states that a physical system evolves along a path that makes the action functional stationary. Now that we have the Euler-Lagrange equation, let's see this in practice!

Consider a single particle of mass $m$ moving in one dimension $x(t)$ under a conservative force. The force can be derived from a potential energy $V(x)$, such that $F = -\\frac{dV}{dx}$.

The kinetic energy is $T = \\frac{1}{2} m x'^2$. The **Lagrangian** for this system is defined as the kinetic energy minus the potential energy:
$$
L(t, x, x') = T - V = \\frac{1}{2} m x'^2 - V(x)
$$

The action $\\mathcal{S}$ is the integral of the Lagrangian over time:
$$
\\mathcal{S}[x] = \\int_{t_0}^{t_1} dt \\, \\left( \\frac{1}{2} m x'^2 - V(x) \\right)
$$

To find the stationary path, we just plug our Lagrangian into the Euler-Lagrange equation! Let's calculate the partial derivatives:
$$
\\frac{\\partial L}{\\partial x} = -\\frac{dV}{dx} = F
$$
$$
\\frac{\\partial L}{\\partial x'} = m x'
$$

Now substitute these into the Euler-Lagrange equation $\\frac{\\partial L}{\\partial x} - \\frac{d}{dt}\\left( \\frac{\\partial L}{\\partial x'} \\right) = 0$:
$$
F - \\frac{d}{dt}(m x') = 0 \\implies F = m x''
$$

This is **Newton's Second Law** ($F = ma$)! We have just derived the foundational equation of classical mechanics simply by requiring that nature acts to keep the action stationary. 
    `
  },
  {
    id: "slide-13",
    title: "2.2 Several dependent variables",
    content: `
When a system involves multiple dependent variables $y_1, y_2, \\dots, y_n$, the functional takes the form:

$$
T(y_1, \\dots, y_n) = \\int_{t_0}^{t_1} dt \\, L(t, y_1, \\dots, y_n, y'_1, \\dots, y'_n)
$$

By considering independent variations $y_i + \\epsilon \\eta_i$ for each function, and applying integration by parts similarly to the single variable case, we require the variations to vanish at the boundaries $\\eta_i(t_0) = \\eta_i(t_1) = 0$.

For $T$ to be stationary, the variational derivative must be zero for all possible variations $\\eta_i$. By the fundamental lemma of variational calculus, this results in a system of $n$ coupled differential equations:

$$
\\frac{\\partial L}{\\partial y_i} - \\frac{d}{dt}\\left( \\frac{\\partial L}{\\partial y'_i} \\right) = 0 \\qquad i = 1, 2, \\dots, n
$$

These are the **Euler-Lagrange equations** for several dependent variables. They form a system of $n$ coupled non-linear second-order differential equations.
    `
  },
  {
    id: "slide-14",
    title: "2.2 Example 3: Shortest curve in a plane",
    content: `
Let's apply this to find the shortest curve connecting two points $p = (x_0, y_0)$ and $q = (x_1, y_1)$ in the plane. The functional to minimize is the length:

$$
T(x, y) = \\int_0^1 dt \\sqrt{x'^2 + y'^2}
$$

Here, the Lagrangian density is $\\mathcal{L}(x,y) = \\sqrt{x'^2 + y'^2}$. Since $\\mathcal{L}$ does not explicitly depend on $x$ or $y$, their partial derivatives are zero: $\\frac{\\partial \\mathcal{L}}{\\partial x} = 0$ and $\\frac{\\partial \\mathcal{L}}{\\partial y} = 0$.

The Euler-Lagrange equations simplify to:

$$
\\frac{d}{dt}\\left( \\frac{x'}{\\sqrt{x'^2 + y'^2}} \\right) = 0 \\implies \\frac{x'}{\\sqrt{x'^2 + y'^2}} = c_1
$$
$$
\\frac{d}{dt}\\left( \\frac{y'}{\\sqrt{x'^2 + y'^2}} \\right) = 0 \\implies \\frac{y'}{\\sqrt{x'^2 + y'^2}} = c_2
$$

Dividing the two constants gives the slope of the curve:

$$
\\frac{dy}{dx} = \\frac{dy/dt}{dx/dt} = \\frac{c_2}{c_1} \\implies y = \\frac{c_2}{c_1} x + c_3
$$

As expected, the shortest path between two points in a flat plane is a **straight line**!
    `
  }
];
