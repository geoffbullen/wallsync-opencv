import * as cv from 'opencv4nodejs';

let inputPath = "/Users/geoff/Projects/WallSync/capture-clone/app/assets/test-resources/1.png";
let outputPath = '/tmp/out.png';


cv.imreadAsync(inputPath)
    .then((inputAsMat)=>{
        
        return straightenImage(inputAsMat);
    })
    .then((outputAsMat)=>{
        return cv.imwriteAsync(outputPath,outputAsMat)
    })
    .then((r)=>{
        console.log(`Completed image straightening from:${inputPath} to:${outputPath} with msg:${r}`);
    })


async function straightenImage(img: cv.Mat){
    let img_gray = await img.cvtColorAsync(cv.COLOR_BGR2GRAY);
    const kernelRow = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    const kernelArray = []
    for (let i = 0; i < 10; i++) {
        kernelArray.push(kernelRow);
    }
    let kernel = new cv.Mat(kernelArray, cv.CV_8U);
    const dilation = await img_gray.erodeAsync(kernel);
    const edges = await dilation.cannyAsync(50, 150, 3);

    const threshold = 50;
    const minLineLength = 5;
    const lines = await edges.houghLinesPAsync(1, Math.PI / 180, threshold, minLineLength, 20);

    let angle_sum = 0;
    let angle_count = 0;
    for (let line of lines) {
        let x1 = line.w;
        let y1 = line.x;
        let x2 = line.y;
        let y2 = line.z;

        const angle = (Math.atan2((y2 - y1), (x2 - x1)) * (180 / Math.PI));
        if (Math.abs(angle) > 50) {
            continue;
        }

        angle_sum += angle;
        angle_count++;
    }


    const angle = angle_sum / angle_count;
    let cols = img.sizes[1];
    let rows = img.sizes[0];
    const M = cv.getRotationMatrix2D(new cv.Point2(cols / 2, rows / 2), angle, 1);
    img = await img.warpAffineAsync(M, new cv.Size(cols, rows));

    return img;
}

export default straightenImage;