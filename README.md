jSnake v1.1.0
======

A hobby project to create a jQuery snake plugin.

Please check the [wiki](https://github.com/fznwebdesign/jSnake/wiki) for implementation guide and tips, just to make sure you are leveraging all the game's features.

## Requirements

This project uses jQuery 1.11.1 which is compatible with all mayor modern browsers.

To run on older versions of IE, you can try with a older version of jQuery, but I cannot assure it will fully work.

## Controls

In order to control your Snake, you need to click on the board to start catching the keyboard events.

The movement of your snake is controlled by the arrow keys.

For mobile devices, there is a graphic interfase for controlling the snake, this can be cofigured to be always visible or never visible (more info on the wiki).

## Rules

The rules of the game are very simple:

1. If you hit a wall (if enabled), another snake or yourself, your snake dies, so, avoid crashing!
2. If you eat a fruit, you gain 10 points (customizable) and your snake grows 2 spaces.
3. If you beat another snake by making them collide with your body (except for your head), you gain 100 points (also customizable).

## Enemies

You can also add some enemies to the game to make things interesting.

There are 2 types of NPC enemy snakes:

**Regular Enemies**: Will compete with you for those fruits.
**Killer Enemies**: Will compete with you for those fruits, but also try to kill you if you get close to them.

## Score Board

There is also a Score Board included on the plugin (not enabled by default), there, you can track who's winning the match.

## CSS Customization

All the items on the game are CSS-styled; you will find that the default styling are basic and plain, well... the idea is that everybody can easily customize their own games, so feel free to play with the CSS.


Enjoy!
