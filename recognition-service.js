// The exported functions in this module makes a call to Microsoft Congnitive Service Computer Vision API and return caption
// description if found. Note: you can do more advanced functionalities like checking
// the confidence score of the caption.

var request = require('request').defaults({ encoding: null });

var VISION_URL = 'https://westcentralus.api.cognitive.microsoft.com/vision/v1.0/recognizeText?handwriting=true&subscription-key=' + process.env.MICROSOFT_VISION_API_KEY;

exports.getIdFromStream = function(stream) {
    return new Promise(
        function(resolve, reject) {
            var requestData = {
                url: VISION_URL,
                encoding: 'binary',
                headers: { 'content-type': 'application/octet-stream' }
            };
            stream.pipe(request.post(requestData,
                function(error, response, body) {
                    if (error) {
                        reject(error);
                    } else if (response.statusCode !== 202) {
                        reject(body);
                    } else {
                        resolve(response.headers['operation-location']);
                    }
                }
            ));
        }
    );
};

exports.getIdFromUrl = function(url) {
    return new Promise(
        function(resolve, reject) {
            var requestData = {
                url: VISION_URL,
                json: { 'url': url }
            };
            request.post(requestData,
                function(error, response, body) {
                    if (error) {
                        reject(error);
                    } else if (response.statusCode !== 202) {
                        reject(body);
                    } else {
                        resolve(response.headers['operation-location']);
                    }
                });
        }
    );
};

exports.extractText = function(url) {
    return new Promise(
        function (resolve, reject) {
            var options = {
                url: url + '?subscription-key=' + process.env.MICROSOFT_VISION_API_KEY,
                method: 'GET',
                headers: { 'content-type': 'application/octet-stream' }
            }
            setTimeout(function() {
                    request(options,
                        function(error, response, body) {
                            if (error) {
                                reject(error);
                            } else if (response.statusCode !== 200) {
                                reject(body);
                            } else {
                                var body = JSON.parse(body);
                                if (body.status == "Succeeded") {
                                    var lines = body.recognitionResult.lines;
                                    lines.sort(function(a, b) {
                                        if (a.boundingBox[1] != b.boundingBox[1]) {
                                            return a.boundingBox[1] - b.boundingBox[1];
                                        } else {
                                            return a.boundingBox[0] - b.boundingBox[0];
                                        }
                                    });
                                    var res = '';
                                    lines.forEach(function(line) {
                                        res += line.text + ' ';
                                    })
                                    resolve(res);
                                } else if (body.status == "Failed") {
                                    reject("Operation failed");
                                } else {
                                    resolve(runAgain(options));
                                }
                            }
                        }
                    );
                },
            2000);
        }
    );
}

function runAgain(options) {
    return new Promise(
        function(resolve, reject) {
            setTimeout(function () {
                    request(options,
                        function (error, response, body) {
                            if (error) {
                                reject(error);
                            } else if (response.statusCode !== 200) {
                                reject(body);
                            } else {
                                var body = JSON.parse(body);
                                if (body.status == "Succeeded") {
                                    var lines = body.recognitionResult.lines;
                                    lines.sort(function (a, b) {
                                        if (a.boundingBox[1] != b.boundingBox[1]) {
                                            return a.boundingBox[1] - b.boundingBox[1];
                                        } else {
                                            return a.boundingBox[0] - b.boundingBox[0];
                                        }
                                    });
                                    var res = '';
                                    lines.forEach(function (line) {
                                        res += line.text + ' ';
                                    })
                                    resolve(res);
                                } else if (body.status == "Failed") {
                                    reject("Operation failed");
                                } else {
                                    reject("Timed out");
                                }
                            }
                        }
                    );
                },
                2000);
        }
    );
}