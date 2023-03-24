/**
 * Quill 객체의 커스텀 모듈을 추가하는 예제입니다.
 *
 */
(function() {
        var exports={};
        "use strict";
        Object.defineProperty(exports, "__esModule", {value: true});

        exports.customOptions = function () {
            function custom(quill, options = {}) {
                this.quill = quill;

                // quill에 fn 추가
                this.quill.__proto__.isQuillEmpty = isQuillEmpty;
            }

            return custom;
        }();


        function isQuillEmpty() {
            let quill = this;
            if ((quill.getContents()['ops'] || []).length !== 1) { return false }
            return quill.getText().trim().length === 0
        }

        window.Quill.register('modules/customOptions',exports.customOptions);}
)();