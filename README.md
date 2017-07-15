# FishWatchr Mini
FishWatchr Mini is an educational observation support system for mobile devices. Students can observe the other students' exercise like presentations and discussions by using the system through Web browsers on their own mobile phones. The observation results of all students are amassed in a Web server, and can be browsed in charts or tables. Moreover, FishWatchr can import the data synchronizing with the video file where the exercise was recorded. 

# Requirements
* HTML5 + JavaScript (client)
* PHP (server)
* [JQuery Mobile (ver.1.4.5 or later)](https://jquerymobile.com/)
* [C3.js (ver.0.4.14 or later)](http://c3js.org/)


# Install
1. Put files included in the src directory to a directory (FWM_DIR) in a Web server.
2. Install JQuery Mobile, C3.js in FWM_DIR
    * jquery.mobile.min.js, jquery.mobile.min.css
    * jquery.min.js (for JQuery Mobile)
    * c3.min.js, c3.min.css
    * d3.min.js (for C3.js)
3. Write .ht_fw_mini.inc based on sample.ht_fw_mini.inc, and put it in FWM_DIR.
4. Set up directories in the Web server based on the .ht_fw_mini.inc.

# Licence
GNU GPL v3
