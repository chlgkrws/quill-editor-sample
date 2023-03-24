let quillEditorToolbar = [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],                          // toggled buttons
    [{ 'color': [] }, { 'background': [] }],                            // dropdown with defaults from theme
    [{ 'align': [] }, { 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],                            // outdent/indent
    [{ 'direction': 'rtl' }],                                           // text direction
    ['image']
];


// const SELECT_BOX_ID_PREFIX = "__qSelect__";
const QUILL_SUPPORT_WRAPID_PREFIX   = "__qWrapId__";    // 최상위 id
const RADIO_ID_PREFIX       = "__qRadio__";             // 라디오 버튼 id
const RADIO_NAME_PREFIX     = "__qRadioName__";         // 라디오 버튼 name

const TEXTAREA_ID_PREFIX    = "__qText__";  // 텍스트 영역 id
const QUILL_WRAP_ID_PREFIX  = "__qWrap__";  // 에디터 영역 id

const QUILL_CONTAINER_ID_PREFIX     = "__qContainer__"; // 에디터 컨테이너 영역 id
const TEXT_EDITOR_AREA_CLASS_PREFIX = "__qInputArea__"; // display 제어를 위한 클래스

const _TEXT_CODE    = "CM100601";
const _EDITOR_CODE  = "CM100603";

/**
 * @param pid : 상위elementid
 * @param isRequired : element필수값여부
 * @param options:
 *          textOptions:
 *              - types: 입력 창 validation 및 placeHolder
 *              - maxLength: 텍스트 제한 길이 (for validation)
 *              - rows: 텍스트 영역 row 수
 *          editorOptions:
 *              - height: 에디터 영역높이
 *          comment:
 *              - last: 영역 마지막에 넣을 html 요소
 *          isRequired: 입력필수여부
 *          defaultValue: 입력영역에 작성될 기본 값.
 * @constructor
 */
function EditorComponent(pid, options) {
    this.parentElementId = pid;
    this.quillEditor    = null;
    this.isRequired     = options?.isRequired == null ? false : options.isRequired;
    this.textOptions    = options?.textOptions;
    this.editorOptions  = options?.editorOptions;
    this.options = options;

    // this.quillConstructor = Quill; 프로토타입 확장으로 Quill 생성자 상속받는 방법, 현재는 구현하지 않음.
}

// Proxy 핸들러
const _QProxyHandler = {
    // 함수 호출 시
    apply: function(target, thisArg, argumentsList) {

        // EditorComponent 인스턴스만 호출할 수 있도록 설정
        if(!(thisArg instanceof EditorComponent)){
            return;
        }

        // 영역 Element ID가 없는 경우 실행하지 않음.
        let element = document.getElementById(thisArg.parentElementId);
        if (isEmpty(element)) {
            return;
        }
        const result = target.apply(thisArg, argumentsList);
        return result;
    },
};

/**
 * 내용 작성영역 생성
 *
 * TODO
 * 기본 값이 텍스트면 텍스트 영역표시, 에디터면 에디터 영역 표시(적용완료)
 */
EditorComponent.prototype.createEditArea = new Proxy(function (){
    const parentElementId = this.parentElementId;
    let parentElement = document.getElementById(parentElementId);

    // 최상위 래퍼 생성
    let wrap = document.createElement('div');
    wrap.setAttribute('id', QUILL_SUPPORT_WRAPID_PREFIX + parentElementId);
    parentElement.appendChild(wrap);

    // 셀렉박스 영역 생성
    // const SELECT = createSelectBox(parentElementId);
    // parentElement.appendChild(SELECT);


    // 라디오 영역 생성 및 렌더링
    let RADIO = createRadioButtons(parentElementId);
    wrap.appendChild(RADIO);

    // 에디터 영역 생성(quill editor 생성) 및 렌더링
    let editorEId = QUILL_CONTAINER_ID_PREFIX + parentElementId;
    let EDITOR = createEditorArea(parentElementId, editorEId, this.editorOptions);
    wrap.appendChild(EDITOR);
    this.quillEditor = createQuillEditor(editorEId);
    let height = this.editorOptions?.height;
    if (height != null) {
        this.quillEditor.editor.scroll.domNode.style.minHeight = '0px';
    }

    // 텍스트 영영 생성 및 렌더링
    let TEXTAREA = createTextArea(parentElementId, this.isRequired, this.textOptions);
    wrap.appendChild(TEXTAREA);

    // 기본 값이 있는 경우 추가.(텍스트 or 에디터)
    setDefaultValue(this.options?.defaultValue, this.quillEditor, this.getTextEId());

    // 라디오버튼 change 이벤트 추가
    addRadioChangeEvent(parentElementId);

    // 기본 값이 있는 경우 해당 영역 노출
    radioButtonClickTrigger(parentElementId, this.options?.defaultValue);

    // 영역 맨 아래에 커맨트 출력
    addComment(wrap, this.options?.comment?.last);

}, _QProxyHandler);

// 텍스트 요소 id 가져오기
EditorComponent.prototype.getTextEId = new Proxy(function (){
    return TEXTAREA_ID_PREFIX + this.parentElementId;
}, _QProxyHandler);

// 기본값 설정
EditorComponent.prototype.setDefaultValue = new Proxy(function (defaultValue) {
    setDefaultValue(defaultValue, this.quillEditor, this.getTextEId());

    radioButtonClickTrigger(this.parentElementId, defaultValue);
}, _QProxyHandler);

// 기본값 설정 (현재 체크한 영역, 상용구 해결을 위해 추가)
EditorComponent.prototype.setDefaultValueAtFocusArea = new Proxy(function (defaultValue) {
    //현재 라디오 체크된 값 가져오기
    let radio = findSelectedRadio(this.parentElementId);
    let textId = TEXTAREA_ID_PREFIX + this.parentElementId;

    let code = radio.value;

    if (code === _TEXT_CODE) {
        document.getElementById(textId).value = defaultValue;
    } else if (code === _EDITOR_CODE) {
        this.quillEditor.deleteText(0, this.quillEditor.getLength());
        this.quillEditor.insertText(0, defaultValue);
    }
}, _QProxyHandler);

// isRequired 설정 값 변경
// false: 필수 값 해제
// true: 필수 값 처리 (객체생성 시 설정 값이 필수값이 아니였다면, true로 설정해도 필수 값 처리는 안됨)
EditorComponent.prototype.setRequireState = new Proxy(function (isRequired) {
    let textEId = this.getTextEId();
    let textElement = document.getElementById(textEId);

    if (isRequired == true && this.isRequired) {
        textElement.setAttribute('required', "required");

    }

    if (isRequired == false){
        textElement.removeAttribute('required');
    }
}, _QProxyHandler);


// 텍스트/에디터 입력 내용 가져오기
EditorComponent.prototype.getContent = new Proxy(function (){
    //현재 라디오 체크된 값 가져오기
    let radio = findSelectedRadio(this.parentElementId);
    let textId = TEXTAREA_ID_PREFIX + this.parentElementId;

    let code = radio.value;
    let content = "";
    if (code === _TEXT_CODE) {
        content = document.getElementById(textId).value;

    } else if (code === _EDITOR_CODE) {
        content = this.quillEditor.getContents();
        content.templateCode = _EDITOR_CODE;
        content = JSON.stringify(content);
    }

    return content;
}, _QProxyHandler);

EditorComponent.prototype.createReadArea = function (){

}

EditorComponent.prototype.clear = function () {
    let textEId = this.getTextEId();
    if (textEId != null) {
        document.getElementById(textEId).textContent = '';
    }

    let quillEditor = this.quillEditor;
    if (quillEditor != null) {
        quillEditor.deleteText(0, quillEditor.getLength());
        quillEditor.insertText(0, '');
    }
};

// 인스턴스 생성까지 필요 없으므로 static한 메서드 생성
EditorComponent.change = function (targets) {
    if (targets != null && targets.length != 0) {
        for (let i = 0; i < targets.length; i++) {
            let target = targets[i];
            if (target.tagName == 'TEXTAREA') { // element가 textarea
                let renderType = target.dataset?.qRender;

                if (renderType == 'ssr') {      // textarea 중 정적으로 그리는 항목
                    let state = target.dataset?.qState;

                    if (state != 'pre-change') {
                        continue;
                    }

                    let value = target.value;
                    let code = getCodeOfContent(value);

                    if (code == _EDITOR_CODE) {         // 정적으로 그리면서 에디터로 변환할 대상
                        let quill = generateReadOnlyQuillEditor(target);
                        target.style.display='none';
                        if (value != null) {
                            quill.setContents(JSON.parse(value));
                            target.dataset.qState = 'changed';
                        }
                    }
                }// textarea - ssr end

                if (renderType == 'dynamic') {  // 동적으로 그리는 항목
                    let value = target.value;
                    if (!isEmpty(value)) {
                        let code = getCodeOfContent(value);
                        if (code == _EDITOR_CODE) {         // 동적으로 그리는 항목 중 에디터처리 해야할 대상
                            let editorArea = target.nextElementSibling;

                            if (editorArea != null && editorArea?.__quill != null) {       // 에디터 영역이 이미 있는 경우, 데이터 엎어치기.
                                displayOnlyEditorArea(target, editorArea, value);
                            } else {                        // 에디터 영역 생성
                                let quill = generateReadOnlyQuillEditor(target);
                                target.style.display = 'none';
                                quill.setContents(JSON.parse(value));
                            }
                        } else if (code == _TEXT_CODE) {    //동적으로 그리는 항목 중 텍스트처리 해야할 대상
                            displayOnlyTextArea(target);
                        }
                    } else {        // 값이 없으면, 이미 생성됐을 수도 있는 quill영역을 안보여줘야함.
                        displayOnlyTextArea(target);
                    }
                }
            }
        }
    }
};

// 입력값 존재 유무 확인
EditorComponent.prototype.isEmpty = new Proxy(function (){
    let radio = findSelectedRadio(this.parentElementId);
    let textId = TEXTAREA_ID_PREFIX + this.parentElementId;

    let code = radio.value;
    let result = true;

    if (code === _TEXT_CODE) {
        let content = document.getElementById(textId).value;
        result = isEmpty(content);
    } else if (code === _EDITOR_CODE) {

        result = this.quillEditor.isQuillEmpty();
    }

    return result;
}, _QProxyHandler);

// 현재 영역을 readOnly로 변경
EditorComponent.prototype.toReadOnlyMode = new Proxy(function () {
    let radioList = findRadioList(this.parentElementId);

    for (let i = 0; i < radioList.length; i++) {
        let element = radioList[i];
        element.setAttribute("disabled", "disabled");
    }

    //현재 라디오 체크된 값 가져오기
    let radio = findSelectedRadio(this.parentElementId);
    let textId = TEXTAREA_ID_PREFIX + this.parentElementId;

    let code = radio.value;
    if (code === _TEXT_CODE) {
        let area = document.getElementById(textId);
        area.setAttribute("disabled", "disabled");
    } else if (code === _EDITOR_CODE) {
        this.quillEditor.container.previousElementSibling.style.display = 'none';  // 툴바 안보이게 처리
        this.quillEditor.container.style.border = '1px solid #ccc';
        this.quillEditor.container.style.backgroundColor = '#F4F4F4';           // 백그라운드 컬러
        this.quillEditor.enable(false);
    }

}, _QProxyHandler);

// 현재 영역을 editMode로 변경
EditorComponent.prototype.toEditMode = new Proxy(function () {
    let radioList = findRadioList(this.parentElementId);

    for (let i = 0; i < radioList.length; i++) {
        let element = radioList[i];
        element.removeAttribute("disabled");
    }

    //현재 라디오 체크된 값 가져오기
    let radio = findSelectedRadio(this.parentElementId);
    let textId = TEXTAREA_ID_PREFIX + this.parentElementId;

    let code = radio.value;
    if (code === _TEXT_CODE) {
        let area = document.getElementById(textId);
        area.removeAttribute("disabled");
    } else if (code === _EDITOR_CODE) {
        this.quillEditor.container.previousElementSibling.style.display = 'block';  // 툴바 안보이게 처리
        this.quillEditor.container.style.border = '1px solid #ccc';
        this.quillEditor.container.style.backgroundColor = '#FFFFFF';           // 백그라운드 컬러
        this.quillEditor.enable(true);
    }

}, _QProxyHandler);


function createEditorArea(parentElementId, editorEId, editorOptions) {
    // <div id="resultEditorWrapper" className="tmlWrap-result" style="display: none;">
    //     <div id="result-editor-container" style="min-height: 400px;"></div>
    // </div>

    let div = document.createElement("div");

    div.setAttribute("id", QUILL_WRAP_ID_PREFIX + parentElementId);
    div.setAttribute("class", TEXT_EDITOR_AREA_CLASS_PREFIX + parentElementId);
    div.style.display = "none";

    let editorDiv = document.createElement("div");

    editorDiv.setAttribute("id", editorEId);

    let height = editorOptions?.height;
    if (height != null) {
        editorDiv.style.height = height+"px";
    }else {
        editorDiv.style.minHeight = "250px";
    }



    div.appendChild(editorDiv);

    return div;
}



// 텍스트 영역 생성
function createTextArea(parentElementId, isRequired, textOptions) {
    // <textarea types="HENS" maxLength="4000" id="srCn" name="srCn" rows="17" className="textarea tmlWrap-1"
    //           style="width:100%;" required="required"></textarea>
    let types = textOptions?.types;
    let maxLength = textOptions?.maxLength;
    let rows = textOptions?.rows;
    let placeHolder = textOptions?.placeHolder;

    if (rows == null) {
        rows = 15;
    }

    let textArea = document.createElement('textarea');
    textArea.style.width = '100%';
    textArea.setAttribute('id', TEXTAREA_ID_PREFIX + parentElementId);
    textArea.setAttribute('class', 'textarea ' + TEXT_EDITOR_AREA_CLASS_PREFIX + parentElementId);
    textArea.setAttribute('rows', rows);

    if(isRequired){
        textArea.setAttribute('required', 'required');
    }

    if (types != null) {
        textArea.setAttribute('types', types);
    }

    if (maxLength != null) {
        textArea.setAttribute('maxLength', maxLength);
    }

    if (placeHolder != null) {
        textArea.setAttribute("placeHolder", placeHolder);
    }

    return textArea;

}

// 라디오버튼 생성
function createRadioButtons(parentElementId) {
    // <div id="reqTySe" className="control">
    //     <label className="radio">
    //         <input type="radio" id="reqTySe0" name="reqTySe" className="reqTySe" value="0215">
    //         <div className="input_button"></div>
    //         <span>단순요청</span>
    //     </label>
    //     <label> ...
    // </div>
    const radioElement = [
        {
            value: _TEXT_CODE,
            text: "텍스트"
        },
        {
            value: _EDITOR_CODE,
            text: "에디터"
        }
    ];
    let radioWrap = document.createElement('div');
    radioWrap.setAttribute('class', 'control');
    radioWrap.setAttribute('id', RADIO_ID_PREFIX + parentElementId);
    radioWrap.style.margin = '10px 15px 15px 5px';

    for (let i = 0; i < radioElement.length; i++) {
        let element = radioElement[i];
        let value = element.value;
        let text = element.text;

        let label = document.createElement('label');
        label.setAttribute('class', 'radio');

        let input = document.createElement('input');
        input.setAttribute('type', 'radio');
        input.setAttribute('value', value);
        input.setAttribute('name', RADIO_NAME_PREFIX + parentElementId);
        if (i == 0) {
            input.checked = true;
        }

        let inputDiv = document.createElement('div');
        inputDiv.setAttribute('class', 'input_button');

        let textSpan = document.createElement('span');
        textSpan.appendChild( document.createTextNode( text ) );

        label.appendChild(input);
        label.appendChild(inputDiv);
        label.appendChild(textSpan);

        radioWrap.appendChild(label);
    }

    return radioWrap;
}


/*function createSelectBox(parentElementId) {
    // <div className="control">
    //     <div className="select" style="width:150px;">
    //         <select id="tmlType" name="tmlType">
    //             <option value="CM100601" selected>텍스트</option>
    //             <option value="CM100603">에디터</option>
    //         </select>
    //     </div>
    // </div>
    let div = document.createElement("div");
    let childDiv = document.createElement("div");
    div.setAttribute("class", "control");
    childDiv.setAttribute("class", "select");
    childDiv.style.width = "150px";

    let selectBox = document.createElement("select");
    selectBox.setAttribute("class", middleId + parentElementId);
    selectBox.setAttribute("id", middleId + parentElementId);
    selectBox.setAttribute("name", middleId + parentElementId);

    let textOption = document.createElement("option");
    let editorOption = document.createElement("option");
    textOption.setAttribute("value", "CM1000601");
    editorOption.setAttribute("value", "CM1000603");
    textOption.appendChild( document.createTextNode( '텍스트' ) );
    editorOption.appendChild( document.createTextNode( '에디터' ) );

    selectBox.appendChild(textOption);
    selectBox.appendChild(editorOption);
    textOption.setAttribute("selected", "selected");
    childDiv.appendChild(selectBox);
    div.appendChild(childDiv);

    return div;
}*/

// Quill 에디터 생성
function createQuillEditor(editorEId) {
    const options = {
        modules: {
            toolbar: quillEditorToolbar,
            imageDrop: true,
            customOptions: true
        },
        placeholder: '',
        theme: 'snow'
    };

    return new Quill('#'+editorEId, options);
}

// 코맨트 출력하기.
function addComment(wrap ,comment) {
    if (comment != null) {
        let parser = new DOMParser();
        let doc = parser.parseFromString(comment, 'text/html');
        let childNodes = doc.body.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
            let childNode = childNodes[i];
            wrap.appendChild(childNode);
        }
    }
}

// 라디오 버튼 change 이벤트
function addRadioChangeEvent(parentElementId) {
    // 라디오 버튼 찾기
    let radioList = findRadioList(parentElementId);

    // 라디오 버튼에 대한 이벤트 핸들러 추가
    radioList.forEach(radio =>  radio.addEventListener('change', (e) => {
        let radioList = findRadioList(parentElementId);
        // check 상태 전부 없애기
        for (let i = 0; i < radioList.length; i++) {
            radioList[i].checked = false;
        }

        // 선택한 Radio만 checked 상태 부여
        const selected = e.target;
        selected.checked = true;

        // 텍스트/에디터 영역 전체 숨기기
        let displayClass = TEXT_EDITOR_AREA_CLASS_PREFIX + parentElementId;
        let displayClasses = document.querySelectorAll('#' + parentElementId + ' .' + displayClass);
        for (let i = 0; i < displayClasses.length; i++) {
            displayClasses[i].style.display = 'none';
        }

        const code = selected.value;

        // 선택된 텍스트, 에디터 영역 display하기
        if (code === _TEXT_CODE) {
            let textArea = document.getElementById(TEXTAREA_ID_PREFIX + parentElementId);
            textArea.style.display = 'block';
        } else if (code === _EDITOR_CODE) {
            let editorArea = document.getElementById(QUILL_WRAP_ID_PREFIX + parentElementId);
            editorArea.style.display = 'block';
        }

    }));
}

function radioButtonClickTrigger(parentElementId, value) {
    let radioList = findRadioList(parentElementId);
    let code = getCodeOfContent(value);

    for (let i = 0; i < radioList.length; i++) {
        let radioListElement = radioList[i];

        if (radioListElement.value == code) {
            radioListElement.click();
            return;
        }
    }
}


// 라디오 버튼 찾기
function findRadioList(parentElementId) {
    let selectBoxId = RADIO_ID_PREFIX + parentElementId;
    let selectBoxName = RADIO_NAME_PREFIX + parentElementId;
    let radioList = document.querySelectorAll('#'+selectBoxId + ' input[type=radio][name="'+selectBoxName+'"]');

    return radioList;
}


// 현재 선택된 라디오 버튼찾기
function findSelectedRadio(parentElementId) {
    let radioList = findRadioList(parentElementId);

    for (let i = 0; i < radioList.length; i++) {
        let radio = radioList[i];
        if (radio.checked == true) {
            return radio;
        }
    }
}


// [void] 기본값 설정
function setDefaultValue(defaultValue, quill, textId) {
    if (defaultValue != null) {
        let code = getCodeOfContent(defaultValue);
        if (code === _TEXT_CODE) {
            document.getElementById(textId).textContent = defaultValue;
        } else if (code === _EDITOR_CODE) {
            quill.setContents(JSON.parse(defaultValue));
        }
    }
}



function getCodeOfContent(value) {
    let parsed = parseJson(value);
    if (parsed && parsed.templateCode === _EDITOR_CODE) {
        return _EDITOR_CODE;
    }

    return _TEXT_CODE;
}


function parseJson(str) {
    try {
        let parsed = JSON.parse(str);

        if (typeof parsed === 'object') {
            return parsed;
        }
    } catch (error) {
        // 예외 처리 생략
    }
    return null;
}

function generateQRandomId() {
    let randomString = Math.random().toString(36).substring(2, 11);
    let randomNumber = new Date().getTime();
    return 'q-' + randomString + randomNumber;

}

function generateReadOnlyQuillEditor(target) {
    let htmlElement = document.createElement('div');
    let randomId = generateQRandomId();
    htmlElement.setAttribute('id', randomId);
    target.after(htmlElement);

    let quill = new Quill('#'+randomId, {theme: 'snow',   "modules": {"toolbar": false}});
    quill.enable(false);
    quill.container.style.backgroundColor = '#F4F4F4';           // 백그라운드 컬러
    quill.editor.scroll.domNode.style.minHeight = '0px';

    return quill;
}

function displayOnlyEditorArea(target, editorArea, value) {
    let innerQuill = editorArea.__quill;
    target.style.display = 'none';
    innerQuill.setContents(JSON.parse(value));
    editorArea.style.display = 'block';
}

function displayOnlyTextArea(targetEl) {
    let editorArea = targetEl.nextElementSibling;
    if (editorArea != null && editorArea?.__quill != null) {
        editorArea.style.display = 'none';
    }

    targetEl.style.display = 'block';
}