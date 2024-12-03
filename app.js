const canvas = document.getElementById('webgpu-canvas');

// Initialize WebGPU
async function initWebGPU() {
    if (!navigator.gpu) {
        console.error('WebGPU is not supported.');
        return;
    }

    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();

    const context = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format });

    // Render pipeline setup
    const pipeline = device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({
                code: `
                @vertex
                fn main(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
                    return vec4<f32>(position, 1.0);
                }
                `,
            }),
            entryPoint: 'main',
        },
        fragment: {
            module: device.createShaderModule({
                code: `
                @fragment
                fn main() -> @location(0) vec4<f32> {
                    return vec4<f32>(1.0, 1.0, 1.0, 1.0);
                }
                `,
            }),
            entryPoint: 'main',
        },
        primitive: { topology: 'point-list' },
        layout: 'auto',
    });

    // Create and render a simple buffer
    const starData = new Float32Array([
        -0.5, -0.5, 0.0,
         0.5, -0.5, 0.0,
         0.0,  0.5, 0.0,
    ]);

    const buffer = device.createBuffer({
        size: starData.byteLength,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    });

    new Float32Array(buffer.getMappedRange()).set(starData);
    buffer.unmap();

    function render() {
        const commandEncoder = device.createCommandEncoder();
        const pass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: context.getCurrentTexture().createView(),
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
            }],
        });

        pass.setPipeline(pipeline);
        pass.setVertexBuffer(0, buffer);
        pass.draw(3);
        pass.end();

        device.queue.submit([commandEncoder.finish()]);
    }

    render();
}

initWebGPU();
