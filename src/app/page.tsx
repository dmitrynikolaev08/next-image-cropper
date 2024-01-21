'use client';

import { useRef, useState, ChangeEvent } from 'react';
import JSZip from 'jszip';

type UploadedImage = {
    src: string;
    name: string;
};

export default function Home() {
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        if (files && files.length > 0) {
            const formData = new FormData();
            const imageFiles = Array.from(files);
            imageFiles.forEach((image) => {
                formData.append('image', image);
            });

            setLoading(true);

            const res = await fetch('/api/crop-images', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const croppedImages = data.croppedImages.map((image: any) => ({
                    src: URL.createObjectURL(
                        new Blob([new Uint8Array(image.buffer.data)], {
                            type: 'image/png',
                        })
                    ),
                    name: image.name,
                }));
                setLoading(false);
                setUploadedImages(croppedImages);
            } else {
                setLoading(false);
                setError('Error cropping images');
            }
        }
    };

    const handleDownloadAll = async () => {
        const zip = new JSZip();
        const imageFolder = zip.folder('processed-images');

        await Promise.all(
            uploadedImages.map(async (image) => {
                const response = await fetch(image.src);
                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();
                imageFolder!.file(image.name, arrayBuffer);
            })
        );

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'processed-images.zip');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setUploadedImages([]);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    // const renderImages = () => {
    //     return uploadedImages.map((image, index) => (
    //         <div key={index} className="m-4">
    //             <img
    //                 src={image.src}
    //                 alt={image.name}
    //                 className="h-auto w-auto"
    //             />
    //         </div>
    //     ));
    // };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
            <h1 className="mb-6 text-4xl font-bold">Image Handler v1.0</h1>
            {(!uploadedImages || uploadedImages?.length === 0 || error) && (
                <>
                    <button
                        type="button"
                        onClick={triggerFileInput}
                        className="mb-4 px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition duration-300 disabled:opacity-50"
                        disabled={loading}
                    >
                        Upload Images
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        className="hidden"
                    />
                </>
            )}

            {error && <p className="text-red-500">{error}</p>}
            {/* <div className="flex flex-wrap justify-center"> */}
            {/*     {renderImages()} */}
            {/* </div> */}
            {loading && <p className="text-blue-500">Loading...</p>}
            {uploadedImages?.length > 0 && (
                <>
                    <span className="font-semibold text-lg mb-3 mt-6">
                        {uploadedImages.length}{' '}
                        {uploadedImages.length === 1
                            ? 'image has '
                            : 'images have '}
                        been successfully processed!
                    </span>
                    <button
                        type="button"
                        onClick={handleDownloadAll}
                        className="mb-4 px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition duration-300"
                    >
                        Download processed images
                    </button>
                </>
            )}
        </main>
    );
}
