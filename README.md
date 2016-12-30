#OneNote_List_Tracker
This little software will track you onenote list finishing progress.

## Getting started
These are the things you will need to do in order to make this software work.

### How to install
This software does not require to install. Simply download the .rar, extract it, and it is ready to do.
The download page in [here](https://github.com/s92025592025/onenote_list_progress/releases/tag/v1.0).

### How to use it
To let this software know what list in your Onenote section should be tracked, you will need to do something in both your onenote pages and the Settings in this software. This software will have twi sections. The first section will track only one check list, which refer to the progress that you should finish by today. Another section will track all the other mutiple check list that you have in the you sections

#### In Onenote
Due to the fact that Onenote doesn't really have the catagory of list(they are actually all "pages" even if you put a todo list in it), you will have to specify dates in the title. Due to the strict for make of javascript, the date should only be expressed in following format.

	1.ISO Date: YYYY-MM-DD
	```
	2016-12-30, 2017-01-20, 2015-05-06 ...etc
	```
	2.Short Date: MM/DD/YYYY or YYYY/MM/DD
	```
	03/04/2016, 2016/04/25 ...etc
	```
	3.Long Date: Month(abbr) DD YYYY or DD Month(abbr) YYYY
	```
	Mar 06 2015, 31 Dec 2017 ...etc
	```
	4.Full Date: DAY Month DD YYYY
	```
	Friday December 30 2016, Saturday April 01 2017 ...etc
	```

Besides the format of the date, the title should also be different according to it is a progress for today or others.
##### For Today
If it is suppose to be the check list of what you should do today, make the title of that page on with a single date of that day. **DO NOT PUT ANYTHING ELSE** or this software won't detect anything you should do today. Below is an example of the title you should be naming(if 'today' is 2016/12/30).
```
2016/12/30
```
and this is it. Nothing else, but only **Date**. If the section has more then one page that has the same date, it will only display the progress it got at the last.
##### For Others
For other check list, you may specify a period of time and other information in the title. The format should be
```
[DATE~DATE] This is my title for a list that shoud be tracked in a period of times
```
or
```
[DATE] This is another title for a list that should be tracked in this date
```
The date should be inside [] no matter what.

#### In Software
After you are prompt to sign in you onenote account, a list of your notebooks and sections in your account will be shown(The page can be found in "Settings" if you managed to close it). Choose the one you have your list for today and check "Today"(only one section can be selected), and check "Track"(can choose mutiple at once) for sections that you have list that you want to see on the software.

## Build With
* [Electron](https://github.com/electron/electron) - used in desktop application
* [progressbar.js](https://kimmobrunfeldt.github.io/progressbar.js/) - used in displaying the progress of each check list
* [notebook.png](http://www.flaticon.com/authors/madebyoliver) - used as the icon for the .exe