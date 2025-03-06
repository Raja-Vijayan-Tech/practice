import React, { useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import 'tippy.js/dist/tippy.css';
import Header from '../components/Header';
import TemplateDesign from '../components/main/TemplateDesign';
import MyImages from '../components/MyImages';
import Image from '../components/Image';
import Draw from '../components/Draw';
import { generateRandom4DigitNumber } from '../helper/Helpers';
import { GetImages } from '../ServerApi/server';
import Background from '../components/Background';
import Pdf from '../components/Pdf';
import { PlaceHolder } from '../helper/PlaceHolder';
import Elements from '../components/Elements';
import html2canvas from 'html2canvas';
import { saveEditedHTML } from '../ServerApi/server';
import BackgroundImage from "../assets/img/stripe.jpg";
import { getSessionData } from '../ServerApi/server';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import Dialogs from './DesignModuleSections/Dialogs';
import Sidebar from './DesignModuleSections/Sidebar';
import MainContent from './DesignModuleSections/MainContent';
import EditorToolbar from './DesignModuleSections/EditorToolbar';
import CustomSnackbar from './DesignModuleSections/Snackbar';

Modal.setAppElement('#root');

export default function Main() {

    const initialEditOptions = {
        width: 0,
        height: 0,
        rotate: 0,
        opacity: 1,
        fontSize: 0,
        fontFamily: '',
        color: '',
        backgroundColor: '',
        bold: false,
        italic: false,
        underline: false,
        left: false,
        middle: false,
        right: false,
        top: false,
        bottom: false,
        middleVertical: false,
        blur: 1,
        brightness: 100,
        contrast: 0,
        grayscale: 0,
        invert: 0,
        sepia: 0
    };
    const frameCoordinates = {
        bleedAreaX: 450,
        bleedAreaY: 575,
        pageSizeX: 425,
        pageSizeY: 550,
        contentAreaX: 375,
        contentAreaY: 500,
    };

    const [currentComponent, setCurrentComponent] = useState('');
    const [popupOpen, setPopupOpen] = useState(false);
    const navigate = useNavigate();
    const [state, setState] = useState('design');
    const [isPageLoaded, setIsPageLoaded] = useState(false);
    const [selectedElement, _setSelectedElement] = useState(null);
    const [drawState, setDrawState] = useState();
    const [isSectionActivated, setIsSectionActivated] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [preventStatus, setPreventStatus] = useState('');
    const [undoRedoStatus, setUndoRedoStatus] = useState({});
    const [isElementAdded, setIsElementAdded] = useState(0);
    const [JSX, setJSX] = useState([]);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [isElementUpdated,] = useState(1);
    const [isDrawActivated, setIsDrawActivated] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const existingEditId = localStorage.getItem('editId');
    const createComponentRef = useRef(null);
    const [dragData, setDragData] = useState();
    const colorPickerRef = useRef(null);
    const [pdfPages, setPdfPages] = useState(null);
    const [pdfId, setPdfId] = useState(0);
    const [pdfTitle, setPdfTitle] = useState('');
    const [pdfCategory, setPdfCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageRefs = useRef([]);
    const containerRef = useRef(null);
    const [editOptions, setEditOptions] = useState(initialEditOptions);
    const [show, setShow] = useState({ status: true, name: '' });
    const [backgroundImages, setBackgroundImages] = useState([]);
    const [pngImages, setPngImages] = useState([]);
    const [elementImages, setElementImages] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isRangeVisible, setIsRangeVisible] = useState(false);
    const [isTransparencyVisible, setIsTransparencyVisible] = useState(false);
    const [isAlignmentVisible, setIsAlignmentVisible] = useState(false);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [isEditorActive, setIsEditorActive] = useState(false);
    const [settings, setSettings] = useState({
        applyEditingRuler: JSON.parse(sessionStorage.getItem('settings'))?.applyEditingRuler || false, // Default value for the checkbox
    });

    const fetchImages = async (imageType) => {
        try {
            const getImagesApiResponse = await GetImages(imageType, null);
            if (getImagesApiResponse.status === 200) {
                if (imageType === 'background') {
                    setBackgroundImages(getImagesApiResponse.data.design_assets);
                } else if (imageType === 'png') {
                    setPngImages(getImagesApiResponse.data.design_assets);
                } else if (imageType === 'svg') {
                    setElementImages(getImagesApiResponse.data.design_assets);
                }
                setIsLoaded(true);
            }
        } catch (error) {
            console.log('Error while fetch the images -->', error.message);
        }
    };

    const setElements = async (name, imageType) => {
        if (imageType !== null) {
            fetchImages(imageType);
        }
        setShow({
            state: false,
            name
        });

        sessionStorage.removeItem('currentPreview');
        setIsSectionActivated(!isSectionActivated);
    };

    const componentStyle = [{
        name: 'main_frame',
        type: 'rect',
        id: generateRandom4DigitNumber(),
        pageCount: 0,
        height: 480,
        width: 240,
        z_index: 1,
        color: '#fff',
    }];

    const [components, setComponents] = useState([...componentStyle]);

    const newComponent = () => {
        const countMainFrames = components.filter(component => component.name === 'main_frame').length;
        const style = {
            name: 'main_frame',
            type: 'rect',
            id: generateRandom4DigitNumber(),
            pageCount: countMainFrames,
            height: 480,
            width: 240,
            z_index: 1,
            color: '#fff',
        }
        setComponents(prevState => ([...prevState, style]));
        const interval = setInterval(() => {
            const rulerContainer = document.querySelector('.rulerContainer');
            if (rulerContainer) {
                let scriptText = ``;
                const selector = `.rulerContainer`;
                scriptText += `jquery('${selector}').ruler();`;

                if (scriptText) {
                    const script = document.createElement('script');
                    script.id = 'jquery-ruler-script';
                    script.type = 'text/javascript';
                    script.text = scriptText;
                    document.body.appendChild(script);
                }
                clearInterval(interval);
            }
        }, 100);
    }

    const showPdfUrl = (pdf) => {
        setPdfPages(pdf.pages);
        setPdfId(pdf.id);
        setPdfTitle(pdf.title_name);
        setPdfCategory(pdf.pdfType);
    };


    useEffect(() => {
        const fullUrl = window.location.href;
        const urlParams = new URLSearchParams(window.location.search);
        const sessionLinkFromUrl = urlParams.get("session_link");
        const userId = localStorage.getItem("userId");

        if (sessionLinkFromUrl) {
            sessionStorage.setItem("sessionLink", fullUrl);
        }

        const sessionLink = sessionStorage.getItem("sessionLink");

        if (sessionLink && userId) {
            const fetchSessionData = async () => {
                try {
                    const data = await getSessionData(sessionLink, userId);
                    setPdfPages(decodeURIComponent(data.pdfPages));
                    setPdfId(data.pdfId);
                    setIsPageLoaded(true);
                } catch (error) {
                    if (error.response?.status === 403) {
                        setPopupOpen(true);
                    } else if (error.response?.status === 404) {
                        alert("Session not found.");
                    } else {
                        console.error("Error fetching session data:", error);
                        setPopupOpen(true);
                    }
                }
            };

            fetchSessionData();
            sessionStorage.removeItem('sessionLink')
        }
    }, []);

    const handleDialogClose = () => {
        localStorage.removeItem('userId')
        localStorage.removeItem('role')
        navigate('/')
    };

    const getElementStyles = (data = {}) => {
        if (Object.keys(data).length) {
            setEditOptions(data);
        }
    };

    const setSelectedElement = (element) => {
        _setSelectedElement(element);
    };

    const storeDrawData = (data) => {
        setDrawState(data);
    }

    const reset = () => {
        sessionStorage.removeItem('currentPreview');
        setElements('design');
        setState('design');
        setIsSectionActivated(!isSectionActivated);
    }

   
    // Define text styles for different types
    const textStyles = {
        textBox: {
            fontSize: '16px',
            fontWeight: 'normal',
            color: '#000',
        },
        heading: {
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#000',
        },
        subHeading: {
            fontSize: '20px',
            fontWeight: 'semibold',
            color: '#000',
        },
    };

    const handleDragStart = (type) => {
        const dragData = {
            type: type,
            styles: textStyles[type], // Get the styles based on the type
        };
        setDragData(dragData);
    };

    const handleDragEnd = (e) => {
        const { clientX, clientY } = e;
        const pages = document.querySelectorAll('.previewArea, .frameBleed');
        let droppedOnPage = null;

        // Determine which page the text is dropped on
        pages.forEach((page) => {
            const rect = page.getBoundingClientRect();
            if (
                clientX >= rect.left &&
                clientX <= rect.right &&
                clientY >= rect.top &&
                clientY <= rect.bottom
            ) {
                droppedOnPage = page; // This should be a single page element
            }
        });

        if (droppedOnPage) {
            const pageRect = droppedOnPage.getBoundingClientRect();
            const relativeX = clientX - pageRect.left;
            const relativeY = clientY - pageRect.top;

            if (dragData && typeof dragData === 'object') {
                if (dragData.type) {
                    // Create a new text element
                    const newText = document.createElement('p');
                    newText.textContent = "Click to edit..."; // Default text
                    newText.style.position = 'absolute';
                    newText.style.top = `${relativeY}px`;
                    newText.style.left = `${relativeX}px`;
                    newText.style.border = '2px solid transparent';
                    newText.style.padding = '5px';
                    newText.style.cursor = 'text';
                    newText.style.minWidth = '100px';
                    newText.style.minHeight = '30px';
                    newText.style.zIndex = '10';

                    // Apply styles based on the type
                    const styles = dragData.styles;
                    if (styles) {
                        newText.style.fontSize = styles.fontSize;
                        newText.style.fontWeight = styles.fontWeight;
                        newText.style.color = styles.color;
                    } else {
                        console.error("Styles are undefined for dragData:", dragData);
                    }

                    // Add event listeners for focus and blur
                    newText.addEventListener('focus', () => {
                        newText.style.border = '2px solid blue';
                        if (newText.textContent === "Click to edit...") {
                            newText.textContent = '';
                        }
                    });

                    newText.addEventListener('blur', () => {
                        newText.style.border = '2px solid transparent';
                        if (newText.textContent.trim() === '') {
                            newText.textContent = "Click to edit...";
                        }
                    });

                    droppedOnPage.appendChild(newText); // Append to the correct page
                    newText.focus(); // Optionally focus the new text element
                }
            }
        } else {
            console.warn("No valid drop target found."); // This indicates the issue
        }

        setDragData(null); // Clear the drag data after handling the drop
    };


    const setAddElement = (selector = "", element, clientX, clientY, targetPage = null) => {
        if (!element) return;

        const page = targetPage || document.querySelectorAll('.previewArea')?.[currentPage - 1];
        if (!page) return;

        const dropX = clientX;
        const dropY = clientY;

        const createElementWithStyles = (tagName, styles = {}, attributes = {}) => {
            const elem = document.createElement(tagName);
            Object.assign(elem.style, styles);
            Object.keys(attributes).forEach(attr => elem.setAttribute(attr, attributes[attr]));
            return elem;
        };

        const appendBoxWithContent = (contentElement, boxStyles = {}) => {
            const boxElement = createElementWithStyles('div', {
                position: 'absolute',
                top: `${dropY}px`,
                left: `${dropX}px`,
                ...boxStyles,
            });
            boxElement.classList.add('box');
            if (selector === 'frame') {
                boxElement.classList.add('frame-container');
            }
            boxElement.appendChild(contentElement);
            page.appendChild(boxElement);
        };
        console.log("Selector :",selector)
        switch (selector) {
            
            case "text": {
                const newText = createElementWithStyles(
                    element,
                    {
                        position: 'absolute',
                        top: `${dropY}px`,
                        left: `${dropX}px`,
                        border: '2px solid transparent'
                    }
                );
                newText.innerHTML = "Click to edit...";
                page.appendChild(newText);
                break;
            }

            case "image": {
                if (selectedElement && selectedElement.className.includes('frame-container')) {
                    const imgElement = selectedElement.querySelector('img');
                    if (imgElement) {
                        imgElement.src = element;
                    }
                } else {
                    const imgElement = createElementWithStyles(
                        'img',
                        {
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            top: '0',
                            left: '0',
                            pointerEvents: 'none',
                        },
                        { src: element }
                    );
                    appendBoxWithContent(imgElement, { width: '100px', height: '100px' });
                }
                break;
            }

            case "svg": {
                const svgContainer = createElementWithStyles(
                    'div',
                    { pointerEvents: 'none' }
                );
                svgContainer.classList.add('svgContainer');
                svgContainer.innerHTML = atob(element);
                appendBoxWithContent(svgContainer);
                break;
            }

            case "frame": {
                const frameStyles = { width: '100px', height: '100px' };
                const imgStyles = {
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    pointerEvents: 'none',
                };

                const imgElement = createElementWithStyles(
                    'img',
                    imgStyles,
                    { src: BackgroundImage }
                );

                if (element === 'box-corner') {
                    imgElement.style.borderRadius = '8px';
                } else if (element !== 'box-default') {
                    imgElement.style.clipPath = element;
                }

                appendBoxWithContent(imgElement, frameStyles);
                break;
            }

            default:
                console.warn("Unknown selector:", selector);
                break;
        }

        setIsElementAdded(isElementAdded + 1);
    };

    const handlePDFElementDelete = () => {
        const focusedElement = document.querySelectorAll('[data-id="true"]');
        if (focusedElement?.length) {
            _.forEach(focusedElement, item => {
                item.remove();
            });
            setCurrentComponent('');
        }
    };

    const startResizing = (resizeEvent, direction, targetElement) => {
        let startX = resizeEvent.clientX;
        let startY = resizeEvent.clientY;
        const startWidth = parseInt(window.getComputedStyle(targetElement).width, 10);
        const startHeight = parseInt(window.getComputedStyle(targetElement).height, 10);

        const onMouseMove = (moveEvent) => {
            let newWidth = startWidth;
            let newHeight = startHeight;

            if (direction.includes('right') || direction.includes('left')) {
                const offsetX = moveEvent.clientX - startX;
                newWidth = direction.includes('right') ? startWidth + offsetX : startWidth - offsetX;
            }

            if (direction.includes('bottom') || direction.includes('top')) {
                const offsetY = moveEvent.clientY - startY;
                newHeight = direction.includes('bottom') ? startHeight + offsetY : startHeight - offsetY;
            }

            // Apply new dimensions with a minimum size check
            if (newWidth > 20) targetElement.style.width = `${newWidth}px`;
            if (newHeight > 20) targetElement.style.height = `${newHeight}px`;
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const createResizeHandlers = async (element) => {
        await removeResizeHandlers();
        const directions = ['bottom-right'];
        setIsEditorActive(true);

        directions.forEach((direction) => {
            const handler = document.createElement('div');
            handler.className = `resize-handler ${direction}-resize`;
            handler.setAttribute('contentEditable', false);
            Object.assign(handler.style, {
                position: 'absolute',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: 'rgb(139 61 255)',
                cursor: `${direction}-resize`,
                zIndex: '10',
            });

            // Direction-specific styling
            if (direction === 'bottom-right') {
                Object.assign(handler.style, {
                    bottom: '-6px',
                    right: '-6px',
                });
            }

            handler.addEventListener('mousedown', (resizeEvent) => {
                resizeEvent.stopPropagation();
                startResizing(resizeEvent, direction, element);
            });

            element.appendChild(handler);
        });
    };

    const removeResizeHandlers = async () => {
        document.querySelectorAll('[data-temp="true"]').forEach(item => {
            item.style.border = 'none';
        });

        document.querySelectorAll('.resize-handler').forEach(handler => {
            handler.remove();
        });
        setIsEditorActive(false);
    };

    let currentElement = null;
    let isDragging = false;
    let isClicked = false;
    let isElementActive = false;
    let clickOffset = { x: 0, y: 0 };

    const handlePdfPageController = (e) => {
        if (isDrawActivated) return;

        const element = e.target;
        const RootElement = document.getElementById('pdfContainer');

        // Ignore interaction for specific elements
        const ignoredClassesOrIds = [
            'previewArea', 'resize', 'svgContainer', 'stage', 'gsw', 'frameBleed', 'FramePage', 'pbp',
            'pf', 'page', 'vector', 'cml', 'cmr', 'cbd'
        ];
        if (
            ignoredClassesOrIds.some(cls => element.className.includes(cls) || element.id.includes(cls)) ||
            ['IMG', 'CANVAS'].includes(element.tagName)
        ) {
            return;
        }

        if (e.type === 'mouseover' && !isElementActive) {
            element.style.border = `2px solid rgb(139 61 255)`;
            element.setAttribute('data-temp', true);
            element.style.textAlign = '';

            document.querySelectorAll('.box').forEach(box => box.classList.remove('box'));
        }

        if (e.type === "click" && !isElementActive) {

            resetEditableElements(RootElement);

            document.querySelectorAll('[data-id="true"]').forEach(el => {
                el.style.border = 'none';
                el.removeAttribute('data-id');
            });

            createResizeHandlers(element);

            isClicked = true;
            element.style.cssText += `
                outline: none;
                border-radius: 5px;
                padding: 5px;
                border: 2px solid rgb(139 61 255);
            `;
            element.setAttribute('data-id', true);
            setCurrentComponent(true);
            setSelectedElement(element);

            applyElementStyles(element);

            if (isTextElement(element)) {
                element.contentEditable = "true";
                element.spellcheck = false;
                element.style.cursor = "text";
                if (element.innerText.trim() !== "") {
                    element.focus();
                }
            }
        } else if (e.type === "click") {
            element.style.border = 'none';
        }

        if (e.type === 'mouseout') {
            if (!isClicked) {
                if (element.hasAttribute('data-id')) {
                    setCurrentComponent('');
                }
            } else {
                isClicked = false;
            }
            if (!element.hasAttribute('data-id')) {
                element.style.border = 'none';
            }
            element.style.cssText += `
                padding: 0;
                border-radius: 0;
            `;
        }

        if (e.type === 'mousedown') {
            e.preventDefault();
            isDragging = true;
            isElementActive = true;
            currentElement = element;
            element.style.cursor = 'grab';

            const rect = element.getBoundingClientRect();
            clickOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        }

        if (e.type === 'mouseup') {
            currentElement = null;
            isDragging = false;
            isElementActive = false;
            element.style.cursor = 'default';
            IsElementUpdated();
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && currentElement && !isDrawActivated) {
            const parentElement = currentElement.parentElement;
            const parentRect = parentElement.getBoundingClientRect();

            const mouseX = e.clientX - parentRect.left;
            const mouseY = e.clientY - parentRect.top;

            const newLeft = mouseX - clickOffset.x;
            const newTop = mouseY - clickOffset.y;

            currentElement.style.left = `${newLeft}px`;
            currentElement.style.top = `${newTop}px`;
        }
    };

    // Helper function: Reset all editable elements
    const resetEditableElements = (rootElement) => {
        const editableElements = Array.from(rootElement.querySelectorAll('[contentEditable="true"]'));
        editableElements.forEach(item => item.contentEditable = "false");
    };

    // Helper function: Apply styles from the selected element
    const applyElementStyles = (element) => {
        const computedStyle = getComputedStyle(element);

        // Parse the filter string
        const filterRegex = /(\w+)\(([^)]+)\)/g; // Matches filter name and value pairs
        const filterValues = {};
        const filterString = computedStyle.filter;

        // Extract individual filter values
        let match;
        while ((match = filterRegex.exec(filterString)) !== null) {
            const [_, filterName, value] = match;
            // Convert the value to a number if possible
            filterValues[filterName] = parseFloat(value);
        }

        // Define default values for filters (fallback if not present in the filter string)
        const {
            blur = 0,
            brightness = 1,
            contrast = 1,
            grayscale = 0,
            invert = 0,
            sepia = 0,
        } = filterValues;

        const styles = {
            width: computedStyle.width,
            height: computedStyle.height,
            fontSize: computedStyle.fontSize,
            fontFamily: computedStyle.fontFamily,
            color: rgbToHex(computedStyle.color),
            backgroundColor: rgbToHex(computedStyle.backgroundColor),
            opacity: computedStyle.opacity,
            transform: computedStyle.transform,
            // Parsed filter values (converted to percentages where applicable)
            blur: blur, // in px
            brightness: brightness * 100, // in percentage
            contrast: contrast * 100, // in percentage
            grayscale: grayscale * 100, // in percentage
            invert: invert * 100, // in percentage
            sepia: sepia * 100, // in percentage
        };

        const transformValues = styles.transform.match(/matrix\((.+)\)/);
        styles.rotate = transformValues
            ? Math.round(Math.atan2(transformValues[1][1], transformValues[1][0]) * (180 / Math.PI))
            : 0;

        console.log(styles, 'styles');

        getElementStyles(styles);
    };

    // Helper function: Convert RGB to Hex
    const rgbToHex = (rgb) => {
        const result = rgb.match(/\d+/g).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
        return `#${result}`;
    };

    const isTextElement = (element) => {
        const textTags = ['P', 'SPAN', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
        return textTags.includes(element.tagName);
    };

    const saveWork = async () => {

        if (isSaving) {
            console.log('Save in progress. Please wait.');
            return;
        }

        setIsSaving(true);
        
        const workSpace = document.querySelectorAll('.previewArea');
        let pages = [];

        if (workSpace?.length) {
            workSpace.forEach(item => {
                const previewSpace = item;

                if (previewSpace) {

                    console.log(document.querySelectorAll('.previewArea')); // Check if text elements are present
                    const tempHTML = previewSpace.cloneNode(true);

                    let outerHTML = previewSpace.cloneNode(true);
                    const elementsToRemove = outerHTML.querySelectorAll('[id*="pf"]');
                    elementsToRemove.forEach(element => element.remove());

                    const modifiedInnerHTML = outerHTML.innerHTML;

                    const pfContainer = tempHTML.querySelector('[id*="pf"]');
                    if (pfContainer) {
                        pfContainer.insertAdjacentHTML('beforeend', modifiedInnerHTML);
                    }

                    const width = tempHTML.style.width;
                    const height = tempHTML.style.height;

                    tempHTML.removeAttribute('style');
                    tempHTML.style.width = width;
                    tempHTML.style.height = height;

                    // reset the pdf focused element
                    const focusedElement = tempHTML.querySelectorAll('[data-id="true"]');
                    if (focusedElement?.length) {
                        focusedElement.forEach(item => {
                            item.style.border = '';
                            item.removeAttribute('data-id');
                        });
                    }

                    const elementsWithCursor = tempHTML.querySelectorAll('[style*="cursor"]');

                    elementsWithCursor.forEach(element => {
                        element.style.cursor = 'pointer';
                    });

                    const JSX = `${tempHTML.outerHTML}`;
                    pages.push(JSX);
                }
            });

            const pdfChanges = `
                      <!DOCTYPE html>
                      <html>
                      <head>
                          <meta http-equiv="content-type" content="text/html; charset=UTF-8"/>
                          <style>
                          ${document.getElementById('pdf-page-styles')?.innerHTML}
                          </style>
                          <script>
                           try{
                              pdf2htmlEX.defaultViewer = new pdf2htmlEX.Viewer({});
                           }catch(e){}
                          </script>
                      </head>
                      <body style="color:#000000;">
                          ${pages.join('')}
                      </body>
                      </html>
                    `;

            const user_id = localStorage.getItem('userId');
            const email = localStorage.getItem('email');
            if (pdfId && user_id && email && pdfChanges) {
                const generatePreview = document.querySelector('.pdfPage-1');
                let imgUrl = '';
                if (generatePreview) {
                    await html2canvas(generatePreview).then(canvas => {
                        imgUrl = canvas.toDataURL('image/png');
                    }).catch(error => {
                        console.error('Error generating preview:', error);
                    });
                }
                const payload = {
                    pdf_id: pdfId,
                    title_name: pdfTitle,
                    embedded_pages: encodeURIComponent(pdfChanges),
                    user_id,
                    email,
                    imgUrl,
                    pdfType: pdfCategory,
                    edit_id: existingEditId
                };
                const autosave = document.getElementById('autosave-icon');
                if (autosave) {
                    autosave.classList.add('animate-pulse', 'glow-animation');
                    setTimeout(() => {
                        autosave.classList.remove('animate-pulse', 'glow-animation');
                    }, 1000);
                }

                try {
                    const response = await saveEditedHTML(payload);
                    if (response.status === 201) {
                        console.log('Save successful!');
                        const newEditId = response.data?.edit_id;
                        if (newEditId) {
                            localStorage.setItem('editId', newEditId);
                        }
                    } else {
                        console.error('Save failed:', response.status);
                    }
                } catch (error) {
                    console.error('Save error:', error);
                }
            }
        }

        setIsSaving(false);
    };

    const updateDisableStatus = (props) => {
        setUndoRedoStatus(props);
    }

    const handleClick = () => {
        colorPickerRef.current.click();
    };

    useEffect(() => {
        const loadPdf = async () => {

            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = pdfPages;
            const pagesCount = tempContainer.querySelectorAll('[id*="pf"]');

            if (pagesCount?.length) {
                for (let index = 1; index < pagesCount?.length; index++) {
                    if (components?.length <= index) {
                        newComponent();
                    }
                }

                if (components?.length > pagesCount?.length) {
                    document.querySelectorAll('[name="main_frame"]').forEach(function (element, index) {
                        if (index >= pagesCount?.length) {
                            setTimeout(() => {
                                element.remove();
                            }, 100);
                        }
                    });

                    setComponents(prevState => ([...prevState].slice(0, pagesCount?.length)));
                }
            }
        };
        if (pdfPages) {
            loadPdf();
        }
    }, [pdfPages]);

    useEffect(() => {

        const handleEventClick = async (event) => {
            if (event.target.id === "pdfContainer") {
                await setCurrentComponent('');
                const currentPreview = sessionStorage.getItem('currentPreview');
                if (currentPreview && currentPreview !== "draw") {
                    sessionStorage.removeItem('currentPreview');
                }

                document.querySelectorAll('[data-id="true"]').forEach(el => {
                    el.style.border = 'none';
                    el.removeAttribute('data-id');
                    el.contentEditable = "false";
                    removeResizeHandlers();
                });
            }
        }

        window.addEventListener('click', handleEventClick);
        window.addEventListener('beforeunload', () => {
            sessionStorage.removeItem('currentPreview');
        })

        return () => {
            window.removeEventListener('click', handleEventClick);
        };

    }, []);

    useEffect(() => {
        if (state) sessionStorage.setItem('currentPreview', state);
    }, [state])

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsPageLoaded(true);
        }, 3800);

        return () => clearTimeout(timer);
    }, [window.location.pathname]);

    useEffect(() => {
        let isIndexZero = false;
        const handleScroll = () => {
            pageRefs.current.forEach((page, index) => {
                if (page) {
                    const rect = page.getBoundingClientRect();
                    const isInViewport = rect.top >= 0 && rect.top < window.innerHeight * 0.7;
                    if (isInViewport) {
                        if (index === 0 || isIndexZero) {
                            index++;
                            isIndexZero = true;
                        }
                        setCurrentPage(index);
                    }
                }
            });
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [pageRefs.current]);

    useEffect(() => {
        const runPreventStatus = () => {
            if (preventStatus && JSX.length > 0) {
                const maxLength = JSX?.length;
                let newPosition = currentPosition;
                const history = JSX;

                if (preventStatus.includes('undo')) {
                    if (newPosition >= 1) {
                        newPosition -= 1;
                        if (newPosition >= 1) {
                            updateDisableStatus({ key: '', status: false });
                        } else {
                            updateDisableStatus({ key: 'undo', status: true });
                        }
                    } else {
                        updateDisableStatus({ key: 'undo', status: true });
                    }
                    if (history[newPosition]) {
                        const selectedJSX = history[newPosition];
                        const stages = document.querySelectorAll('.previewArea');
                        if (stages?.length) {
                            _.forEach(stages, (stage, index) => {
                                stage.innerHTML = selectedJSX[index] || '';
                                stage.addEventListener('click', handlePdfPageController);
                                stage.addEventListener('mouseover', handlePdfPageController);
                                stage.addEventListener('mouseout', handlePdfPageController);
                                stage.addEventListener('mousedown', handlePdfPageController);
                                stage.addEventListener('mouseup', handlePdfPageController);
                                stage.addEventListener('mousemove', handleMouseMove);
                            })
                        }
                    }
                } else if (preventStatus.includes('redo')) {
                    if (newPosition < maxLength) {
                        newPosition += 1;
                        updateDisableStatus({ key: '', status: false });
                    }
                    if (newPosition === maxLength) {
                        updateDisableStatus({ key: 'redo', status: true });
                    }
                    if (history[newPosition]) {
                        const selectedJSX = history[newPosition];
                        const stages = document.querySelectorAll('.previewArea');
                        if (stages?.length) {
                            _.forEach(stages, (stage, index) => {
                                stage.innerHTML = selectedJSX[index] || '';
                                stage.addEventListener('click', handlePdfPageController);
                                stage.addEventListener('mouseover', handlePdfPageController);
                                stage.addEventListener('mouseout', handlePdfPageController);
                                stage.addEventListener('mousedown', handlePdfPageController);
                                stage.addEventListener('mouseup', handlePdfPageController);
                                stage.addEventListener('mousemove', handleMouseMove);
                            })
                        }
                    }
                }

                if (newPosition !== currentPosition) {
                    setCurrentPosition(newPosition);
                }
            }
        };

        runPreventStatus();
    }, [preventStatus]);

    const IsElementUpdated = () => {
        setIsElementAdded(isElementAdded + 1);
    }

    const updateStore = (key = '') => {
        const executeFunction = () => {
            const stages = document.querySelectorAll('.previewArea');
            if (stages.length) {
                let store = {};
                _.forEach(stages, (element, index) => {
                    store[index] = element.innerHTML;
                });
                if (JSX?.length > 10) {
                    let updatedJsx = [...JSX].slice(1);
                    updatedJsx.push(store);
                    setJSX(updatedJsx);
                } else {
                    let jsx = [...JSX];
                    jsx.push(store);
                    setJSX(jsx);
                }
                setCurrentPosition(currentPosition + 1);
                updateDisableStatus({ key: '', status: false });
            }
        };

        if (key === 'renderWithDelay') {
            setTimeout(executeFunction, 4000);
        } else {
            executeFunction();
        }
    };

    useEffect(() => {
        if (isElementUpdated || isElementAdded) {
            updateStore();
        }
    }, [isElementUpdated, isElementAdded]);

    useEffect(() => {
        const interval = setInterval(() => {
            updateStore('renderWithDelay');
            setElements('design');
            setState('design');
            const rulerContainer = document.querySelector('.rulerContainer');
            if (rulerContainer !== null) {
                let scriptText = ``;
                const selector = `.rulerContainer`;
                scriptText += `jquery('${selector}').ruler();`;

                if (scriptText) {
                    const script = document.createElement('script');
                    script.id = 'jquery-ruler-script';
                    script.type = 'text/javascript';
                    script.text = scriptText;
                    document.body.appendChild(script);
                }
            }
            clearInterval(interval);
        }, 4000);
    }, []);

    const handleAlert = (data) => {
        if (data.alertStatus) {
            setSnackbarOpen(true);
            setSnackbarMessage(data.message);
            setSnackbarSeverity(data.apiStatus)
        }
    };

    // Handle checkbox change
    const handleCheckboxChange = (e) => {
        setSettings((prevSettings) => ({
            ...prevSettings,
            applyEditingRuler: e.target.checked,
        }));
    };

    return (
        <React.Fragment>
            <Dialogs popupOpen={popupOpen} setPopupOpen={setPopupOpen} handleDialogClose={handleDialogClose} />
            {!isPageLoaded ? (
                <PlaceHolder />
            ) : (
                <div className='min-w-screen bg-[#f6f7f8]'>
                    <Header setSaveStatus={saveWork} preventKey={setPreventStatus} status={undoRedoStatus} pdfId={pdfId} addNewPage={newComponent} />
                    <div className='flex h-[calc(100%-60px)]'>
                        <Sidebar setElements={setElements} setState={setState} state={state} />
                        <div className='w-[calc(100%-0px)]'>
                            {/* Sidebar content */}
                            <div className={`${show.status ? 'p-0 -left-[50%]' : `left-[85px] py-5`} p-1 bg-[#f6f7f8] shadow-lg h-full fixed w-[350px] z-30`} style={{ marginTop: '60px', borderLeft: '2px solid rgba(0,0,0,0.1)', borderRight: '3px solid rgba(0,0,0,0.03)' }}>
                            {
                                     state === 'design' && <div>
                                         <div className='w-full h-auto overflow-hidden -mt-[14px]'>
                                             {<TemplateDesign showPdfUrl={showPdfUrl} createComponentRef={createComponentRef} />}
                                         </div>
                                     </div>
                                 }
                                 {
                                     state === 'image' && <div className='h-[80vh] overflow-x-auto flex justify-start items-start 
                                         scrollbar-hide -mt-[14px]'>
                                         <MyImages setAddElement={setAddElement} handleAlert={handleAlert} createComponentRef={createComponentRef} />
                                     </div>
                                 }
                                 {
                                    state === 'text' && <React.Fragment>
                                        <div>
                                            <div className='grid grid-cols-1 gap-2'>
                                                <button
                                                    draggable
                                                    onDragStart={() => handleDragStart('textBox')}
                                                    onDragEnd={handleDragEnd}
                                                    className='bg-[#f6f7f8] hover:bg-[rgb(0,0,0,0.02)] cursor-pointer font-[400] p-3 text-[14px] text-[#333] text-xl rounded-md border-[1px] solid border-[rgba(0,0,0,0.2)] flex items-center justify-center max-h-[45px]'
                                                >
                                                    Add a text box
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-[#333] my-[21px] text-[17px] font-bold">
                                            Default text styles
                                        </div>
                                        <div className='grid grid-cols-1 gap-2'>
                                            <p
                                                draggable
                                                onDragStart={() => handleDragStart('heading')}
                                                onDragEnd={handleDragEnd}
                                                className='bg-[#f6f7f8] hover:bg-[rgb(0,0,0,0.02)] cursor-pointer font-[400] p-3 text-[14px] text-[#333] text-xl rounded-md border-[1px] solid border-[rgba(0,0,0,0.2)] flex items-center justify-center max-h-[45px]'
                                            >
                                                Add a heading
                                            </p>
                                        </div>
                                        <div className='grid grid-cols-1 gap-2'>
                                            <p
                                                draggable
                                                onDragStart={() => handleDragStart('subHeading')}
                                                onDragEnd={handleDragEnd}
                                                className='bg-[#f6f7f8] hover:bg-[rgb(0,0,0,0.02)] cursor-pointer font-[400] p-3 text-[14px] text-[#333] text-xl rounded-md border-[1px] solid border-[rgba(0,0,0,0.2)] flex items-center justify-center max-h-[45px]'
                                            >
                                                Add a sub heading
                                            </p>
                                        </div>
                                    </React.Fragment>
                                }
                                 {
                                     state === 'projects' && (
                                         <div className='h-[80vh] overflow-x-auto flex justify-start items-start scrollbar-hide -mt-[14px]'>
                                             <Pdf showPdfUrl={showPdfUrl} />
                                         </div>
                                     )
                                 }
                                 {
                                     state === 'element' && <div className='h-[80vh] overflow-x-auto flex justify-start items-start 
                                         scrollbar-hide -mt-[14px]'>
                                         <Elements myImages={elementImages} setAddElement={setAddElement} createComponentRef={createComponentRef} />
                                     </div>
                                 }
                                 {
                                     state === 'initImage' && <div className='h-[80vh] overflow-x-auto flex justify-start items-start 
                                         scrollbar-hide w-full -mt-[14px]'>
                                         <Image myImages={pngImages} setAddElement={setAddElement} isLoaded={isLoaded} createComponentRef={createComponentRef} />
                                     </div>
                                 }
                                 {
                                     state === 'background' && <div className='h-[80vh] overflow-x-auto flex justify-start items-start 
                                         scrollbar-hide -mt-[14px]'>
                                         <Background myImages={backgroundImages} setAddElement={setAddElement} isLoaded={isLoaded} createComponentRef={createComponentRef} />
                                     </div>
                                 }
                                 {
                                     state === 'settings' && <div className='h-[80vh] overflow-x-auto flex flex-col justify-start items-start 
                                         scrollbar-hide -mt-[14px] -ml-[30px]'>
                                         <ul className="w-full">
                                             <li className="bg-gradient-to-b from-purple-900 via-[rgba(255,255,255, 0.8)] to-indigo-900 p-2 rounded-sm text-white cursor-pointer">
                                                 Yearbook Settings
                                             </li>
                                             <li className="p-2 flex gap-2 items-center text-black">
                                                 <input
                                                     id='applyEditingRuler'
                                                     type="checkbox"
                                                     checked={settings.applyEditingRuler}
                                                     onChange={handleCheckboxChange}
                                                 />
                                                 <label htmlFor='applyEditingRuler' className='mt-2 cursor-pointer'>Apply Editing Ruler</label>
                                             </li>
                                             <button
                                                 className="bg-gradient-to-b from-purple-900 via-[rgba(255,255,255, 0.8)] to-indigo-900 text-white py-1 px-2 rounded-sm mt-2"
                                                 onClick={() => {
                                                     sessionStorage.setItem('settings', JSON.stringify({ applyEditingRuler: settings?.applyEditingRuler }));
                                                     window.location.reload();
                                                 }}
                                             >
                                                 Apply Changes
                                             </button>
                                         </ul>
                                     </div>
                                 }
                                 {
                                     state === 'draw' && <div className='h-[350px] overflow-x-auto flex flex-col justify-start items-start scrollbar-hide -mt-[40px] ml-[10px]'>
                                         <button
                                             className="mt-[20px] w-full text-left py-[10px] px-3 font-semibold text-gray-800 flex justify-between items-center hover:bg-blue-100 transition-all duration-200 ease-in-out sticky top-0 bg-white z-10"
                                         >
                                             <span className="text-md text-[rgba(0,0,0,0.7)]">Select the sketch</span>
                                         </button>
                                         <Draw storeDrawData={storeDrawData} />
                                     </div>
                                 }
                            </div>
    
                            {/* Main Content */}
                            <MainContent
                             createComponentRef={createComponentRef}
                                components={components}
                                pdfPages={pdfPages}
                                editOptions={editOptions}
                                selectedElement={selectedElement}
                                drawState={drawState}
                                isSectionActivated={isSectionActivated}
                                setIsElementUpdated={IsElementUpdated}
                                reset={reset}
                                handlePdfPageController={handlePdfPageController}
                                handleMouseMove={handleMouseMove}
                                setIsDrawActivated={setIsDrawActivated}
                                frameCoordinates={frameCoordinates}
                            />
    
                            {/* Editor Toolbar */}
                            {isEditorActive && (
                                <EditorToolbar
                                    colorPickerRef={colorPickerRef}
                                    handleClick={handleClick}
                                    containerRef={containerRef}
                                    editOptions={editOptions}
                                    setEditOptions={setEditOptions}
                                    isRangeVisible={isRangeVisible}
                                    setIsRangeVisible={setIsRangeVisible}
                                    isTransparencyVisible={isTransparencyVisible}
                                    setIsTransparencyVisible={setIsTransparencyVisible}
                                    isAlignmentVisible={isAlignmentVisible}
                                    setIsAlignmentVisible={setIsAlignmentVisible}
                                    isFilterVisible={isFilterVisible}
                                    setIsFilterVisible={setIsFilterVisible}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Snackbar Notification */}
            <CustomSnackbar
                snackbarOpen={snackbarOpen}
                setSnackbarOpen={setSnackbarOpen}
                snackbarSeverity={snackbarSeverity}
                snackbarMessage={snackbarMessage}
            />
        </React.Fragment>
    );
}  


