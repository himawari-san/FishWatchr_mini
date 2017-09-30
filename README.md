# FishWatchr Mini
FishWatchr Mini is an educational observation support tool for mobile devices. Students can observe educational activities such as presentation exercises by using the tool through Web browsers on their own mobile phones. The observation results of all students are merged on a FishWatchr Mini server, and can be displayed in histogram/table format.
 Moreover, The annotation data can be exported to FishWatchr, which is a video annotation system, synchronizing with the video data of the activity.

# Requirements
* HTML5 + JavaScript (client)
* PHP (server)
* [JQuery Mobile (ver.1.4.5 or later)](https://jquerymobile.com/)
* [C3.js (ver.0.4.14 or later)](http://c3js.org/)


# Demo and User Manual
- Visit [https://csd.ninjal.ac.jp/f/m.html](https://csd.ninjal.ac.jp/f/m.html) to try FishWatchr Mini!
- [Japanese User Manual](http://www2.ninjal.ac.jp/lrc/index.php?%B4%D1%BB%A1%BB%D9%B1%E7%A5%C4%A1%BC%A5%EB%20FishWatchr%2FMini) 

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
