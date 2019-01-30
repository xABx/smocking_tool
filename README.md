# Smocking Tool

### Demo

You can find the demo site at https://aaronbrocken.com/smocking-tool

You can use the dat.gui at the top right to cycle through 4 settings. These include 3 presets of popular grids and a 4th setting that recalls the last calculated grid on the interface to the left of the screen.

You can create grids in the interface and use "calculate grid" to see the results on the fabric. The grid matches the fabric when it is flipped over as the grid provides the guide for sewing and the back of the fabric shows you where the points are joined.

You can also move the fabric using the arrow keys, zoom in and out by scrolling, and flip the fabric over by clicking and dragging. 

### What is this?

This is what happens when a developer gets obsessed with sewing. This is a proof of concept to create a tool that helps with modeling smocking grids virtually. It allows a user to create smocking grids on their own through the use of an interface. This way, you can experiment with different grid patterns before going to the trouble of sewing them. This repo is also a handy dandy way of getting set up with three.js and webpack if you aren't particularly interested in sewing. Just clone and you are good to go :)

For some documentation on what this project is for and what smocking is, check out this blog post:

https://aaronbrocken.com/tech/math/art/2018/12/29/Digital-Textile-Manipulation-Part-1.html

### What did you build it with?

* webpack
* three.js
* love (awwww I know, I'm just too much)

### What are the plans for the future
The next iterations of this will work on changing up the interface to make it more efficient to use. This will include:

* Support for doing part of the grid and repeating it to avoid having to fill in the entire grid with a repeated pattern by hand
* Offsetting the the grid points as areas are "sewn" to reduce the stretch of the fabric that you wouldn't have in the real world
* Add print styles so you can print your grids that you like and keep them for when you want to actually sew the pattern
