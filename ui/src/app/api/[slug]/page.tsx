"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Terminal, Image as ImageIcon, FileText, Globe, 
  ArrowRight, Loader, Check, Zap, Server, Code, 
  ShieldCheck, ChevronLeft, Play, Copy, CheckCircle2,
  FileDown, UploadCloud
} from 'lucide-react';

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  desc: string;
}

const capabilitiesMap: Record<string, Array<{ title: string; desc: string }>> = {
  'universal-ai-formatter': [
    { title: 'Context-Aware Structure', desc: 'Preserves original intent while structuring headers, tables, and lists.' },
    { title: 'Local WASM Fallback', desc: 'Optional local compiler compiles document themes with sub-millisecond execution.' },
    { title: 'Metadata Extraction', desc: 'Extracts formatting markers, word counts, and language statistics dynamically.' },
    { title: 'Automatic Failover', desc: 'Automatic routing to fallback LLM nodes if primary nodes experience high latency.' }
  ],
  'json-formatter-validator': [
    { title: 'Deep Syntax Auto-Repair', desc: 'Fixes missing quotes, trailing commas, unmatched brackets, and invalid comments.' },
    { title: 'Zero Cold Starts', desc: 'Runs in native runtime environment for single-digit millisecond response times.' },
    { title: 'Strict Schema Check', desc: 'Validates structure compliance against standard JSON specifications.' },
    { title: 'High-Speed Minification', desc: 'Compresses whitespaces and newlines for high-throughput network transport.' }
  ],
  'heic-to-jpg-converter': [
    { title: 'EXIF Preservation', desc: 'Keeps camera metadata, geolocation coordinates, and timestamps fully intact.' },
    { title: 'Client-Side WebAssembly', desc: 'Fallback local decoder parses HEIC structure inside the browser canvas sandbox.' },
    { title: 'Redundant Server Nodes', desc: 'Dynamic scaling workers scale to process batch image inputs with zero queues.' },
    { title: 'Rate-Control Optimization', desc: 'Intelligent compression maps optimal file weights to desired quality percentages.' }
  ],
  'html-to-print-ready-pdf': [
    { title: 'Vector PDF Rendering', desc: 'Compiles text, CSS layout structures, and system font families into clean vector paths.' },
    { title: 'Print Layout Bleeds', desc: 'Full support for custom margins, standard A4 sizes, and print page break rules.' },
    { title: 'Dynamic Header & Footer', desc: 'Custom running page headers and footers with auto-calculated page indices.' },
    { title: 'HF Sandbox Pool Pings', desc: 'Automatic failover monitoring redirects jobs to active Hugging Face spaces.' }
  ]
};

function highlightJson(json: any): React.ReactNode {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2);
  }
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;
  
  let match;
  let keyCount = 0;
  while ((match = regex.exec(json)) !== null) {
    const matchStr = match[0];
    const index = match.index;
    
    if (index > lastIndex) {
      parts.push(json.substring(lastIndex, index));
    }
    
    let style: React.CSSProperties = {};
    if (/^"/.test(matchStr)) {
      if (/:$/.test(matchStr)) {
        style = { color: 'oklch(0.70 0.15 195)' }; // Beautiful cyan
      } else {
        style = { color: 'oklch(0.78 0.16 145)' }; // Green
      }
    } else if (/true|false/.test(matchStr)) {
      style = { color: 'oklch(0.75 0.14 75)' }; // Orange
    } else if (/null/.test(matchStr)) {
      style = { color: 'oklch(0.60 0.12 15)' }; // Muted red
    } else {
      style = { color: 'oklch(0.72 0.18 25)' }; // Amber
    }
    
    parts.push(
      <span key={keyCount++} style={style}>
        {matchStr}
      </span>
    );
    
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < json.length) {
    parts.push(json.substring(lastIndex));
  }
  
  return <>{parts}</>;
}

export default function ApiDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [activeLang, setActiveLang] = useState<'curl' | 'js' | 'python' | 'go' | 'rust' | 'csharp' | 'java' | 'php' | 'ruby'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'body' | 'headers'>('body');
  const [copiedResponse, setCopiedResponse] = useState(false);
  
  // Formatter sandbox states
  const [formatterText, setFormatterText] = useState('Clean this up and present it as a structured review.');
  const [formatterStyle, setFormatterStyle] = useState('modern');

  // JSON sandbox states
  const [jsonSandboxText, setJsonSandboxText] = useState("{\n  \"name\": \"John\",\n  \"age\": 30,\n  \"skills\": [\n    \"React\",\n    \"Node\"\n  ]\n}");
  const [jsonSandboxAction, setJsonSandboxAction] = useState('Format');
  
  // HEIC sandbox states
  const [heicFile, setHeicFile] = useState<File | null>(null);
  const [heicFormat, setHeicFormat] = useState<'jpg' | 'png'>('jpg');
  const [heicQuality, setHeicQuality] = useState('0.95');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sandboxRef = useRef<HTMLDivElement>(null);
  const codeBlockRef = useRef<HTMLDivElement>(null);

  // PDF sandbox states
  const [pdfHtml, setPdfHtml] = useState('<h1>Developer API Report</h1><p>This PDF was generated live via the SaaS printing node.</p>');
  
  // Global sandbox states
  const [loading, setLoading] = useState(false);
  const [resStatus, setResStatus] = useState<number | null>(null);
  const [resTime, setResTime] = useState<number | null>(null);
  const [resBody, setResBody] = useState<any>(null);
  const [resImgUrl, setResImgUrl] = useState<string | null>(null);
  const [resPdfUrl, setResPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (resImgUrl) URL.revokeObjectURL(resImgUrl);
      if (resPdfUrl) URL.revokeObjectURL(resPdfUrl);
    };
  }, [resImgUrl, resPdfUrl]);

  // Valid endpoints configuration
  const configMap: Record<string, {
    title: string;
    desc: string;
    endpoint: string;
    method: 'POST';
    headers: Record<string, string>;
    params: Parameter[];
    curlCode: string;
    jsCode: string;
    pythonCode: string;
    goCode: string;
    rustCode: string;
    csharpCode: string;
    javaCode: string;
    phpCode: string;
    rubyCode: string;
    color: string;
  }> = {
    'universal-ai-formatter': {
      title: 'Universal AI Document Formatter API',
      desc: 'Integrate structure-formatting LLM intelligence into your automation pipelines. Convert noisy unformatted inputs directly into clean structural document specifications.',
      endpoint: '/api/v1/format',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      params: [
        { name: 'text', type: 'string', required: true, desc: 'The unformatted raw transcription or text payload.' },
        { name: 'style', type: 'string', required: false, desc: 'Formatting target layout theme: "modern", "academic", or "minimalist" (defaults to "modern").' },
        { name: 'customHeader', type: 'string', required: false, desc: 'Optional running header text for print/PDF output.' },
        { name: 'customFooter', type: 'string', required: false, desc: 'Optional running footer text for print/PDF output.' }
      ],
      curlCode: `curl -X POST https://mysaastools.vercel.app/api/v1/format \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "messy text here", "style": "modern"}'`,
      jsCode: `fetch('https://mysaastools.vercel.app/api/v1/format', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'messy text here',
    style: 'modern'
  })
})
.then(res => res.json())
.then(data => console.log(data));`,
      pythonCode: `import requests

url = "https://mysaastools.vercel.app/api/v1/format"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "text": "messy text here",
    "style": "modern"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
      goCode: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"io"
)

func main() {
	url := "https://mysaastools.vercel.app/api/v1/format"
	payload := map[string]string{
		"text":  "messy text here",
		"style": "modern",
	}
	jsonVal, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonVal))
	req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}`,
      rustCode: `use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let url = "https://mysaastools.vercel.app/api/v1/format";
    let client = reqwest::Client::new();
    
    let mut headers = HeaderMap::new();
    headers.insert(AUTHORIZATION, HeaderValue::from_static("Bearer YOUR_API_KEY"));
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    let payload = json!({
        "text": "messy text here",
        "style": "modern"
    });

    let res = client.post(url)
        .headers(headers)
        .json(&payload)
        .send()
        .await?
        .text()
        .await?;

    println!("{}", res);
    Ok(())
}`,
      csharpCode: `using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        var client = new HttpClient();
        var url = "https://mysaastools.vercel.app/api/v1/format";
        
        var payload = new { text = "messy text here", style = "modern" };
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        client.DefaultRequestHeaders.Add("Authorization", "Bearer YOUR_API_KEY");
        
        var response = await client.PostAsync(url, content);
        var result = await response.Content.ReadAsStringAsync();
        
        Console.WriteLine(result);
    }
}`,
      javaCode: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {
    public static void main(String[] args) throws Exception {
        String url = "https://mysaastools.vercel.app/api/v1/format";
        String json = "{\\"text\\":\\"messy text here\\",\\"style\\":\\"modern\\"}";

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Bearer YOUR_API_KEY")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }
}`,
      phpCode: `<?php
$url = 'https://mysaastools.vercel.app/api/v1/format';
$data = [
    'text' => 'messy text here',
    'style' => 'modern'
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>`,
      rubyCode: `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse("https://mysaastools.vercel.app/api/v1/format")
request = Net::HTTP::Post.new(uri)
request["Authorization"] = "Bearer YOUR_API_KEY"
request["Content-Type"] = "application/json"
request.body = JSON.dump({
  "text" => "messy text here",
  "style" => "modern"
})

req_options = { use_ssl: uri.scheme == "https" }
response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
  http.request(request)
end

puts response.body`,
      color: 'oklch(0.68 0.18 265)'
    },
    'heic-to-jpg-converter': {
      title: 'HEIC Image Transcoder API',
      desc: 'High-speed, serverless image compression engine. Transcode HEIC files to JPG/PNG directly in memory. Perfect for mobile developer upload pipelines.',
      endpoint: '/api/v1/convert-image',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'multipart/form-data'
      },
      params: [
        { name: 'file', type: 'File binary', required: true, desc: 'The .heic or .heif file buffer.' },
        { name: 'format', type: 'string', required: false, desc: 'Output target format: "jpg" (default) or "png".' },
        { name: 'quality', type: 'number', required: false, desc: 'Compression level (0.01 to 1.0, defaults to 0.95).' }
      ],
      curlCode: `curl -X POST https://mysaastools.vercel.app/api/v1/convert-image \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@/path/to/image.heic" \\
  -F "format=jpg" \\
  -F "quality=0.95" \\
  --output converted.jpg`,
      jsCode: `const formData = new FormData();
formData.append('file', heicFile);
formData.append('format', 'jpg');
formData.append('quality', '0.95');

fetch('https://mysaastools.vercel.app/api/v1/convert-image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
})
.then(res => res.blob())
.then(blob => {
  const url = URL.createObjectURL(blob);
  // Download or preview converted image
});`,
      pythonCode: `import requests

url = "https://mysaastools.vercel.app/api/v1/convert-image"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}
files = {
    "file": ("image.heic", open("image.heic", "rb"), "image/heic")
}
data = {
    "format": "jpg",
    "quality": "0.95"
}

response = requests.post(url, files=files, data=data, headers=headers)
with open("converted.jpg", "wb") as f:
    f.write(response.content)`,
      goCode: `package main

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

func main() {
	url := "https://mysaastools.vercel.app/api/v1/convert-image"
	file, _ := os.Open("image.heic")
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "image.heic")
	io.Copy(part, file)
	writer.WriteField("format", "jpg")
	writer.WriteField("quality", "0.95")
	writer.Close()

	req, _ := http.NewRequest("POST", url, body)
	req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	outFile, _ := os.Create("converted.jpg")
	defer outFile.Close()
	io.Copy(outFile, resp.Body)
	fmt.Println("Image saved successfully.")
}`,
      rustCode: `use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION};
use reqwest::multipart;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let url = "https://mysaastools.vercel.app/api/v1/convert-image";
    let client = reqwest::Client::new();
    
    let mut headers = HeaderMap::new();
    headers.insert(AUTHORIZATION, HeaderValue::from_static("Bearer YOUR_API_KEY"));

    let form = multipart::Form::new()
        .file("file", "image.heic").await?
        .text("format", "jpg")
        .text("quality", "0.95");

    let res = client.post(url)
        .headers(headers)
        .multipart(form)
        .send()
        .await?
        .bytes()
        .await?;

    std::fs::write("converted.jpg", res)?;
    println!("Image saved successfully.");
    Ok(())
}`,
      csharpCode: `using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        var client = new HttpClient();
        var url = "https://mysaastools.vercel.app/api/v1/convert-image";
        client.DefaultRequestHeaders.Add("Authorization", "Bearer YOUR_API_KEY");

        using var content = new MultipartFormDataContent();
        using var fileStream = File.OpenRead("image.heic");
        content.Add(new StreamContent(fileStream), "file", "image.heic");
        content.Add(new StringContent("jpg"), "format");
        content.Add(new StringContent("0.95"), "quality");

        var response = await client.PostAsync(url, content);
        var bytes = await response.Content.ReadAsByteArrayAsync();
        await File.WriteAllBytesAsync("converted.jpg", bytes);
        
        Console.WriteLine("Image saved successfully.");
    }
}`,
      javaCode: `import java.io.File;
import java.nio.file.Files;

public class Main {
    public static void main(String[] args) throws Exception {
        System.out.println("Use standard HTTP Client with a Multipart boundary generator, or curl wrapper:");
        Process process = new ProcessBuilder(
            "curl", "-X", "POST", "https://mysaastools.vercel.app/api/v1/convert-image",
            "-H", "Authorization: Bearer YOUR_API_KEY",
            "-F", "file=@image.heic",
            "-F", "format=jpg",
            "-F", "quality=0.95",
            "--output", "converted.jpg"
        ).start();
        process.waitFor();
        System.out.println("Converted image written to converted.jpg");
    }
}`,
      phpCode: `<?php
$url = 'https://mysaastools.vercel.app/api/v1/convert-image';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, [
    'file' => new CURLFile('image.heic', 'image/heic'),
    'format' => 'jpg',
    'quality' => '0.95'
]);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY'
]);

$response = curl_exec($ch);
curl_close($ch);
file_put_contents('converted.jpg', $response);
echo "Image saved successfully.";
?>`,
      rubyCode: `require 'net/http'
require 'uri'

uri = URI.parse("https://mysaastools.vercel.app/api/v1/convert-image")
request = Net::HTTP::Post.new(uri)
request["Authorization"] = "Bearer YOUR_API_KEY"

boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
request.content_type = "multipart/form-data; boundary=#{boundary}"

post_body = []
post_body << "--#{boundary}\\r\\n"
post_body << "Content-Disposition: form-data; name=\\"file\\"; filename=\\"image.heic\\"\\r\\n"
post_body << "Content-Type: image/heic\\r\\n\\r\\n"
post_body << File.read("image.heic")
post_body << "\\r\\n--#{boundary}\\r\\n"
post_body << "Content-Disposition: form-data; name=\\"format\\"\\r\\n\\r\\njpg\\r\\n"
post_body << "--#{boundary}\\r\\n"
post_body << "Content-Disposition: form-data; name=\\"quality\\"\\r\\n\\r\\n0.95\\r\\n"
post_body << "--#{boundary}--\\r\\n"

request.body = post_body.join

req_options = { use_ssl: uri.scheme == "https" }
response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
  http.request(request)
end

File.write("converted.jpg", response.body)
puts "Image saved successfully."`,
      color: 'oklch(0.72 0.18 25)'
    },
    'html-to-print-ready-pdf': {
      title: 'HTML & Markdown to PDF API',
      desc: 'Convert structured HTML layouts or raw Markdown into stylized, paginated PDF documents with support for crop margins and bleed guides.',
      endpoint: '/api/v1/export-pdf',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      params: [
        { name: 'html', type: 'string', required: true, desc: 'Raw HTML structure payload to format.' },
        { name: 'filename', type: 'string', required: false, desc: 'Optional target filename for download attachment.' },
        { name: 'customHeader', type: 'string', required: false, desc: 'Optional running header text for the PDF page.' },
        { name: 'customFooter', type: 'string', required: false, desc: 'Optional running footer text for the PDF page.' }
      ],
      curlCode: `curl -X POST https://mysaastools.vercel.app/api/v1/export-pdf \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"html": "<h1>My Document</h1>", "filename": "document.pdf"}' \\
  --output document.pdf`,
      jsCode: `fetch('https://mysaastools.vercel.app/api/v1/export-pdf', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    html: '<h1>My Document</h1>',
    filename: 'document.pdf'
  })
})
.then(res => res.blob())
.then(blob => {
  const url = URL.createObjectURL(blob);
  window.open(url);
});`,
      pythonCode: `import requests

url = "https://mysaastools.vercel.app/api/v1/export-pdf"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "html": "<h1>My Document</h1>",
    "filename": "document.pdf"
}

response = requests.post(url, json=payload, headers=headers)
with open("document.pdf", "wb") as f:
    f.write(response.content)`,
      goCode: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	url := "https://mysaastools.vercel.app/api/v1/export-pdf"
	payload := map[string]string{
		"html":     "<h1>My Document</h1>",
		"filename": "document.pdf",
	}
	jsonVal, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonVal))
	req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	outFile, _ := os.Create("document.pdf")
	defer outFile.Close()
	io.Copy(outFile, resp.Body)
	fmt.Println("PDF saved successfully.")
}`,
      rustCode: `use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let url = "https://mysaastools.vercel.app/api/v1/export-pdf";
    let client = reqwest::Client::new();
    
    let mut headers = HeaderMap::new();
    headers.insert(AUTHORIZATION, HeaderValue::from_static("Bearer YOUR_API_KEY"));
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    let payload = json!({
        "html": "<h1>My Document</h1>",
        "filename": "document.pdf"
    });

    let res = client.post(url)
        .headers(headers)
        .json(&payload)
        .send()
        .await?
        .bytes()
        .await?;

    std::fs::write("document.pdf", res)?;
    println!("PDF saved successfully.");
    Ok(())
}`,
      csharpCode: `using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        var client = new HttpClient();
        var url = "https://mysaastools.vercel.app/api/v1/export-pdf";
        
        var payload = new { html = "<h1>My Document</h1>", filename = "document.pdf" };
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        client.DefaultRequestHeaders.Add("Authorization", "Bearer YOUR_API_KEY");
        
        var response = await client.PostAsync(url, content);
        var bytes = await response.Content.ReadAsByteArrayAsync();
        await File.WriteAllBytesAsync("document.pdf", bytes);
        
        Console.WriteLine("PDF saved successfully.");
    }
}`,
      javaCode: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Path;
import java.nio.file.Paths;

public class Main {
    public static void main(String[] args) throws Exception {
        String url = "https://mysaastools.vercel.app/api/v1/export-pdf";
        String json = "{\\"html\\":\\"<h1>My Document</h1>\\",\\"filename\\":\\"document.pdf\\"}";

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Bearer YOUR_API_KEY")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<Path> response = client.send(request, HttpResponse.BodyHandlers.ofFile(Paths.get("document.pdf")));
        System.out.println("PDF written to " + response.body().toString());
    }
}`,
      phpCode: `<?php
$url = 'https://mysaastools.vercel.app/api/v1/export-pdf';
$data = [
    'html' => '<h1>My Document</h1>',
    'filename' => 'document.pdf'
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);
file_put_contents('document.pdf', $response);
echo "PDF saved successfully.";
?>`,
      rubyCode: `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse("https://mysaastools.vercel.app/api/v1/export-pdf")
request = Net::HTTP::Post.new(uri)
request["Authorization"] = "Bearer YOUR_API_KEY"
request["Content-Type"] = "application/json"
request.body = JSON.dump({
  "text" => "<h1>My Document</h1>",
  "filename" => "document.pdf"
})

req_options = { use_ssl: uri.scheme == "https" }
response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
  http.request(request)
end

File.write("document.pdf", response.body)
puts "PDF saved successfully."`,
      color: 'oklch(0.65 0.12 145)'
    },
    'json-formatter-validator': {
      title: 'JSON Formatter & Validator API',
      desc: 'Parse, prettify, compress, or auto-repair messy JSON payloads. Robust schema validation, trailing comma removal, and key quoting correction.',
      endpoint: '/api/v1/format',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      params: [
        { name: 'text', type: 'string', required: true, desc: 'The messy, unformatted, or broken JSON string payload.' },
        { name: 'tool', type: 'string', required: true, desc: 'Must be set to "json" to route parsing to the JSON validator engine.' },
        { name: 'action', type: 'string', required: false, desc: 'Operation to perform: "Format" (default), "Auto-Repair", or "Minify".' }
      ],
      curlCode: `curl -X POST https://mysaastools.vercel.app/api/v1/format \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "{\\'name\\': \\'John\\',}", "tool": "json", "action": "Auto-Repair"}'`,
      jsCode: `fetch('https://mysaastools.vercel.app/api/v1/format', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: "{'name': 'John',}",
    tool: 'json',
    action: 'Auto-Repair'
  })
})
.then(res => res.json())
.then(data => console.log(data));`,
      pythonCode: `import requests

url = "https://mysaastools.vercel.app/api/v1/format"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "text": "{'name': 'John',}",
    "tool": "json",
    "action": "Auto-Repair"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
      goCode: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"io"
)

func main() {
	url := "https://mysaastools.vercel.app/api/v1/format"
	payload := map[string]string{
		"text":   "{'name': 'John',}",
		"tool":   "json",
		"action": "Auto-Repair",
	}
	jsonVal, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonVal))
	req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}`,
      rustCode: `use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let url = "https://mysaastools.vercel.app/api/v1/format";
    let client = reqwest::Client::new();
    
    let mut headers = HeaderMap::new();
    headers.insert(AUTHORIZATION, HeaderValue::from_static("Bearer YOUR_API_KEY"));
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    let payload = json!({
        "text": "{'name': 'John',}",
        "tool": "json",
        "action": "Auto-Repair"
    });

    let res = client.post(url)
        .headers(headers)
        .json(&payload)
        .send()
        .await?
        .text()
        .await?;

    println!("{}", res);
    Ok(())
}`,
      csharpCode: `using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        var client = new HttpClient();
        var url = "https://mysaastools.vercel.app/api/v1/format";
        
        var payload = new { text = "{'name': 'John',}", tool = "json", action = "Auto-Repair" };
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        client.DefaultRequestHeaders.Add("Authorization", "Bearer YOUR_API_KEY");
        
        var response = await client.PostAsync(url, content);
        var result = await response.Content.ReadAsStringAsync();
        
        Console.WriteLine(result);
    }
}`,
      javaCode: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {
    public static void main(String[] args) throws Exception {
        String url = "https://mysaastools.vercel.app/api/v1/format";
        String json = "{\\"text\\":\\"{'name': 'John',}\\",\\"tool\\":\\"json\\",\\"action\\":\\"Auto-Repair\\"}";

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Bearer YOUR_API_KEY")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }
}`,
      phpCode: `<?php
$url = 'https://mysaastools.vercel.app/api/v1/format';
$data = [
    'text' => "{'name': 'John',}",
    'tool' => 'json',
    'action' => 'Auto-Repair'
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>`,
      rubyCode: `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse("https://mysaastools.vercel.app/api/v1/format")
request = Net::HTTP::Post.new(uri)
request["Authorization"] = "Bearer YOUR_API_KEY"
request["Content-Type"] = "application/json"
request.body = JSON.dump({
  "text" => "{'name': 'John',}",
  "tool" => "json",
  "action" => "Auto-Repair"
})

req_options = { use_ssl: uri.scheme == "https" }
response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
  http.request(request)
end

puts response.body`,
      color: 'oklch(0.70 0.15 195)'
    }
  };

  const api = configMap[slug];

  // If dynamic slug doesn't exist, render loading or redirect
  if (!api) {
    return (
      <div style={{ minHeight: '100vh', background: 'oklch(0.10 0.005 250)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <Loader className="spin" size={32} style={{ color: 'oklch(0.68 0.18 265)' }} />
        <span style={{ marginTop: 12, fontSize: 14, fontFamily: 'monospace' }}>Finding API endpoints...</span>
        <button onClick={() => router.push('/api')} style={{ marginTop: 24, padding: '8px 16px', background: 'white', color: 'black', borderRadius: 8, cursor: 'pointer', border: 'none', fontWeight: 600 }}>
          Return to API Directory
        </button>
      </div>
    );
  }

  const handleCopyCode = () => {
    let code = api.curlCode;
    if (activeLang === 'js') code = api.jsCode;
    else if (activeLang === 'python') code = api.pythonCode;
    else if (activeLang === 'go') code = api.goCode;
    else if (activeLang === 'rust') code = api.rustCode;
    else if (activeLang === 'csharp') code = api.csharpCode;
    else if (activeLang === 'java') code = api.javaCode;
    else if (activeLang === 'php') code = api.phpCode;
    else if (activeLang === 'ruby') code = api.rubyCode;

    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyResponse = () => {
    if (resBody) {
      navigator.clipboard.writeText(JSON.stringify(resBody, null, 2));
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  const executeSandbox = async () => {
    setLoading(true);
    setResStatus(null);
    setResBody(null);
    if (resImgUrl) URL.revokeObjectURL(resImgUrl);
    setResImgUrl(null);
    if (resPdfUrl) URL.revokeObjectURL(resPdfUrl);
    setResPdfUrl(null);

    const startTime = Date.now();
    const sandboxToken = 'sb_publishable_V66dv60NGqpWQ80q3PyALQ_Z4w0_08U';

    try {
      if (slug === 'universal-ai-formatter') {
        const res = await fetch(api.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sandboxToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: formatterText,
            style: formatterStyle
          })
        });
        setResStatus(res.status);
        const json = await res.json();
        setResBody(json);

      } else if (slug === 'json-formatter-validator') {
        const res = await fetch(api.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sandboxToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: jsonSandboxText,
            tool: 'json',
            action: jsonSandboxAction
          })
        });
        setResStatus(res.status);
        const json = await res.json();
        setResBody(json);

      } else if (slug === 'heic-to-jpg-converter') {
        if (!heicFile) {
          alert('Please select or upload a HEIC/HEIF image file first.');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', heicFile);
        formData.append('format', heicFormat);
        formData.append('quality', heicQuality);

        const res = await fetch(api.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sandboxToken}`
          },
          body: formData
        });
        setResStatus(res.status);

        if (res.ok) {
          const blob = await res.blob();
          const imgUrl = URL.createObjectURL(blob);
          setResImgUrl(imgUrl);
          setResBody({ status: 'success', message: 'Binary image blob stream returned successfully.' });
        } else {
          const json = await res.json();
          setResBody(json);
        }

      } else if (slug === 'html-to-print-ready-pdf') {
        const res = await fetch(api.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sandboxToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            html: pdfHtml
          })
        });
        setResStatus(res.status);

        if (res.ok) {
          const blob = await res.blob();
          const pdfUrl = URL.createObjectURL(blob);
          setResPdfUrl(pdfUrl);
          setResBody({ status: 'success', message: 'PDF document stream returned successfully.' });
        } else {
          const json = await res.json();
          setResBody(json);
        }
      }
    } catch (err: any) {
      console.error(err);
      setResBody({ error: err.message || 'Sandbox query failed.' });
      setResStatus(500);
    } finally {
      setResTime(Date.now() - startTime);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'oklch(0.10 0.005 250)', // Sleek dark mode terminal
      color: 'oklch(0.97 0.005 250)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      paddingBottom: 100,
    }}>
      {/* Top Breadcrumb Navigation */}
      <div style={{
        borderBottom: '1px solid oklch(0.20 0.008 250)',
        padding: '16px 32px',
        background: 'oklch(0.12 0.005 250 / 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/api" style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          color: 'oklch(0.70 0.01 250)', textDecoration: 'none', fontWeight: 550
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'white'}
        onMouseLeave={e => e.currentTarget.style.color = 'oklch(0.70 0.01 250)'}
        >
          <ChevronLeft size={16} /> API Directory
        </Link>
        <span style={{ fontSize: 12.5, fontFamily: 'monospace', color: 'oklch(0.50 0.01 250)' }}>
          {api.endpoint}
        </span>
      </div>

      <div style={{
        maxWidth: 1200,
        margin: '40px auto 0',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: 40,
        alignItems: 'start',
      }}>
        
        {/* Left Column: API Reference Documentation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.025em', color: 'white' }}>
              {api.title}
            </h1>
            <p style={{ fontSize: 15, color: 'oklch(0.70 0.01 250)', lineHeight: 1.6, margin: 0 }}>
              {api.desc}
            </p>

            {/* Integrated Sleek Route Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'oklch(0.12 0.005 250)',
              border: '1px solid oklch(0.20 0.008 250)',
              borderRadius: 8,
              padding: '8px 12px',
              marginTop: 18,
              maxWidth: 'max-content'
            }}>
              <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: 'white', background: api.color || 'oklch(0.68 0.18 265)', padding: '2px 6px', borderRadius: 4 }}>
                {api.method}
              </span>
              <span style={{ fontSize: 12.5, fontFamily: 'monospace', color: 'white', fontWeight: 500 }}>
                https://mysaastools.vercel.app{api.endpoint}
              </span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`https://mysaastools.vercel.app${api.endpoint}`);
                  alert("Copied endpoint to clipboard!");
                }}
                className="reset"
                style={{ background: 'none', border: 'none', color: 'oklch(0.50 0.01 250)', cursor: 'pointer', display: 'flex', padding: 2 }}
                title="Copy Endpoint URL"
              >
                <Copy size={12} />
              </button>
            </div>

            {/* Premium CTA Row */}
            <div style={{ display: 'flex', gap: 14, marginTop: 24, flexWrap: 'wrap' }}>
              <Link href="/account#api-keys" style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'black',
                background: 'linear-gradient(180deg, oklch(0.78 0.16 145), oklch(0.68 0.18 145))',
                padding: '10px 20px',
                borderRadius: 8,
                textDecoration: 'none',
                boxShadow: '0 2px 8px oklch(0.78 0.16 145 / 0.25)',
                transition: 'all 0.15s ease-in-out',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Get API Key <ArrowRight size={13} />
              </Link>
              <button 
                onClick={() => {
                  sandboxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  // Focus flash sandbox element
                  const sandboxElement = sandboxRef.current;
                  if (sandboxElement) {
                    sandboxElement.style.outline = `2px solid ${api.color || 'oklch(0.68 0.18 265)'}`;
                    sandboxElement.style.boxShadow = `0 0 24px ${api.color || 'oklch(0.68 0.18 265)'}50`;
                    sandboxElement.style.transition = 'all 0.3s ease';
                    setTimeout(() => {
                      sandboxElement.style.outline = 'none';
                      sandboxElement.style.boxShadow = 'none';
                    }, 2000);
                  }
                }}
                className="reset"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'white',
                  background: 'oklch(0.18 0.01 250)',
                  border: '1px solid oklch(0.28 0.01 250)',
                  padding: '10px 20px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'oklch(0.24 0.01 250)';
                  e.currentTarget.style.borderColor = api.color || 'oklch(0.68 0.18 265)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'oklch(0.18 0.01 250)';
                  e.currentTarget.style.borderColor = 'oklch(0.28 0.01 250)';
                }}
              >
                Test in Sandbox <Play size={11} style={{ color: api.color || 'oklch(0.68 0.18 265)' }} />
              </button>
              <a href="/api/openapi.json" download="openapi.json" style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'white',
                background: 'oklch(0.18 0.01 250)',
                border: '1px solid oklch(0.28 0.01 250)',
                padding: '10px 20px',
                borderRadius: 8,
                textDecoration: 'none',
                transition: 'all 0.15s ease-in-out',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'oklch(0.24 0.01 250)';
                e.currentTarget.style.borderColor = api.color || 'oklch(0.68 0.18 265)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'oklch(0.18 0.01 250)';
                e.currentTarget.style.borderColor = 'oklch(0.28 0.01 250)';
              }}
              >
                OpenAPI Spec <FileDown size={13} />
              </a>
            </div>
          </div>

          {/* Endpoint URL and SDK cards were combined or removed for a cleaner, spacious layout. */}

          {/* Header Parameters */}
          <div>
            <h3 style={{ fontSize: 11.5, fontWeight: 700, color: 'white', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Header Parameters</h3>
            <div style={{ background: 'oklch(0.12 0.005 250 / 0.5)', border: '1px solid oklch(0.18 0.008 250)', borderRadius: 10, padding: '8px 16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <tbody>
                  {Object.entries(api.headers).map(([key, val]) => (
                    <tr key={key} style={{ borderBottom: '1px solid oklch(0.16 0.006 250 / 0.5)' }}>
                      <td style={{ padding: '12px 0', fontFamily: 'monospace', color: api.color || 'oklch(0.68 0.18 265)', fontWeight: 600 }}>{key}</td>
                      <td style={{ padding: '12px 0', fontFamily: 'monospace', color: 'oklch(0.70 0.01 250)', textAlign: 'right' }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payload schema reference */}
          <div>
            <h3 style={{ fontSize: 11.5, fontWeight: 700, color: 'white', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payload Fields</h3>
            <div style={{ background: 'oklch(0.12 0.005 250 / 0.5)', border: '1px solid oklch(0.18 0.008 250)', borderRadius: 10, padding: '8px 16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid oklch(0.18 0.008 250)' }}>
                    <th style={{ padding: '10px 0', color: 'white', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>FIELD</th>
                    <th style={{ padding: '10px 0', color: 'white', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>TYPE</th>
                    <th style={{ padding: '10px 0', color: 'white', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>REQ</th>
                    <th style={{ padding: '10px 0', color: 'white', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {api.params.map(param => (
                    <tr key={param.name} style={{ borderBottom: '1px solid oklch(0.16 0.006 250 / 0.5)' }}>
                      <td style={{ padding: '12px 0', fontFamily: 'monospace', color: 'white', fontWeight: 600 }}>{param.name}</td>
                      <td style={{ padding: '12px 0', fontFamily: 'monospace', color: 'oklch(0.50 0.01 250)' }}>{param.type}</td>
                      <td style={{ padding: '12px 0', color: param.required ? 'oklch(0.72 0.18 25)' : 'oklch(0.50 0.01 250)' }}>
                        {param.required ? 'true' : 'false'}
                      </td>
                      <td style={{ padding: '12px 0', color: 'oklch(0.70 0.01 250)', lineHeight: 1.4 }}>{param.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Core Engine Capabilities Checklist Matrix */}
          <div>
            <h3 style={{ fontSize: 11.5, fontWeight: 700, color: 'white', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Core Engine Capabilities</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16
            }}>
              {(capabilitiesMap[slug] || []).map((cap, i) => (
                <div 
                  key={i} 
                  style={{
                    background: 'oklch(0.14 0.006 250 / 0.4)',
                    border: '1px solid oklch(0.20 0.008 250)',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    transition: 'all 0.2s ease-in-out',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = api.color || 'oklch(0.68 0.18 265)';
                    e.currentTarget.style.background = 'oklch(0.15 0.006 250 / 0.6)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'oklch(0.20 0.008 250)';
                    e.currentTarget.style.background = 'oklch(0.14 0.006 250 / 0.4)';
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${api.color || 'oklch(0.68 0.18 265)'}1c`,
                    border: `1px solid ${api.color || 'oklch(0.68 0.18 265)'}4d`,
                    color: api.color || 'oklch(0.68 0.18 265)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Check size={16} />
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: 'white' }}>{cap.title}</h5>
                    <p style={{ margin: 0, fontSize: 11.5, color: 'oklch(0.70 0.01 250)', lineHeight: 1.4 }}>{cap.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing summary */}
          <div style={{
            background: 'oklch(0.14 0.006 250)',
            border: '1px solid oklch(0.20 0.008 250)',
            borderRadius: 14,
            padding: '24px 28px',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} style={{ color: 'oklch(0.78 0.16 145)' }} /> Sandbox vs. Production Tiers
            </h4>
            <p style={{ margin: 0, fontSize: 13.5, color: 'oklch(0.70 0.01 250)', lineHeight: 1.5 }}>
              Guests can run **3 sandbox pings/day**. Sign up for a Free Account to get **10 runs/day** with an API key, upgrade to Pro for **100 runs/day**, or unlock the Developer API tier for high-volume integrations of up to **1,000 runs/day**.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginTop: 4 }}>
              <div style={{ background: 'oklch(0.11 0.005 250)', padding: 10, borderRadius: 8, border: '1px solid oklch(0.18 0.005 250)' }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: 'oklch(0.50 0.01 250)' }}>GUEST SANDBOX</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 4 }}>3 runs / day</div>
              </div>
              <div style={{ background: 'oklch(0.11 0.005 250)', padding: 10, borderRadius: 8, border: '1px solid oklch(0.18 0.005 250)' }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: 'oklch(0.68 0.18 265)' }}>FREE ACCOUNT</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 4 }}>10 runs / day</div>
              </div>
              <div style={{ background: 'oklch(0.11 0.005 250)', padding: 10, borderRadius: 8, border: '1px solid oklch(0.18 0.005 250)' }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: 'oklch(0.72 0.18 25)' }}>PRO PLAN</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 4 }}>100 runs / day</div>
              </div>
              <div style={{ background: 'oklch(0.11 0.005 250)', padding: 10, borderRadius: 8, border: '1px solid oklch(0.18 0.005 250)' }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: 'oklch(0.70 0.15 195)' }}>DEVELOPER API</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 4 }}>1,000 runs / day</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Code snippets & Sandbox terminal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 80 }}>
          
          {/* SDK / Code block card */}
          <div 
            ref={codeBlockRef}
            style={{
              background: '#0e0f12',
              border: '1px solid #1c1d22',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #1c1d22',
              padding: '10px 16px',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '2px 0' }}>
                {[
                  { id: 'curl', label: 'cURL' },
                  { id: 'js', label: 'JavaScript' },
                  { id: 'python', label: 'Python' },
                  { id: 'go', label: 'Go' },
                  { id: 'rust', label: 'Rust' },
                  { id: 'csharp', label: 'C#' },
                  { id: 'java', label: 'Java' },
                  { id: 'php', label: 'PHP' },
                  { id: 'ruby', label: 'Ruby' }
                ].map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setActiveLang(lang.id as any)}
                    className="reset mono"
                    style={{
                      padding: '4px 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 4,
                      background: activeLang === lang.id ? '#1c1d22' : 'transparent',
                      color: activeLang === lang.id ? 'white' : '#7e8394',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopyCode}
                className="reset"
                style={{
                  color: copiedCode ? 'oklch(0.78 0.16 145)' : '#7e8394',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 500
                }}
              >
                {copiedCode ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>

            <pre style={{
              margin: 0, padding: 16, overflowX: 'auto',
              fontFamily: 'monospace', fontSize: 11.5, lineHeight: 1.5,
              color: '#818cf8', background: '#0e0f12', maxBlockSize: 260
            }}>
              <code>
                {activeLang === 'curl' ? api.curlCode : 
                 activeLang === 'js' ? api.jsCode : 
                 activeLang === 'python' ? api.pythonCode : 
                 activeLang === 'go' ? api.goCode : 
                 activeLang === 'rust' ? api.rustCode : 
                 activeLang === 'csharp' ? api.csharpCode : 
                 activeLang === 'java' ? api.javaCode : 
                 activeLang === 'php' ? api.phpCode : 
                 api.rubyCode}
              </code>
            </pre>
          </div>

          {/* Sandbox interactive configuration */}
          <div 
            ref={sandboxRef}
            style={{
              background: 'oklch(0.14 0.006 250)',
              border: '1px solid oklch(0.20 0.008 250)',
              borderRadius: 14,
              padding: 24,
              display: 'flex', flexDirection: 'column', gap: 16,
            }}
          >
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Play size={13} style={{ color: 'oklch(0.78 0.16 145)' }} /> Sandbox API Playground
            </h4>

            {/* Formatter sandbox body fields */}
            {slug === 'universal-ai-formatter' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>TEXT TO FORMAT</label>
                  <textarea
                    rows={3}
                    value={formatterText}
                    onChange={e => setFormatterText(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)',
                      borderRadius: 8, padding: 10, color: 'white', fontSize: 12.5, outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>FORMAT STYLE</label>
                  <select
                    value={formatterStyle}
                    onChange={e => setFormatterStyle(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)',
                      borderRadius: 8, padding: 8, color: 'white', fontSize: 12.5, outline: 'none'
                    }}
                  >
                    <option value="modern">Modern Editorial</option>
                    <option value="academic">Academic Serif</option>
                    <option value="minimalist">Minimalist Mono</option>
                  </select>
                </div>
              </div>
            )}

            {slug === 'json-formatter-validator' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>JSON PAYLOAD</label>
                  <textarea
                    rows={4}
                    value={jsonSandboxText}
                    onChange={e => setJsonSandboxText(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)',
                      borderRadius: 8, padding: 10, color: 'white', fontSize: 12.5, outline: 'none', fontFamily: 'monospace'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>ACTION</label>
                  <select
                    value={jsonSandboxAction}
                    onChange={e => setJsonSandboxAction(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)',
                      borderRadius: 8, padding: 8, color: 'white', fontSize: 12.5, outline: 'none'
                    }}
                  >
                    <option value="Format">Format & Validate</option>
                    <option value="Auto-Repair">Auto-Repair Broken JSON</option>
                    <option value="Minify">Minify (Compress)</option>
                  </select>
                </div>
              </div>
            )}

            {/* HEIC sandbox body fields */}
            {slug === 'heic-to-jpg-converter' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>INPUT HEIC FILE</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed oklch(0.24 0.01 250)', background: '#0e0f12',
                      borderRadius: 8, padding: '16px 20px', textAlign: 'center', cursor: 'pointer',
                      transition: 'border 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
                    }}
                  >
                    <input
                      type="file"
                      accept=".heic,.heif"
                      ref={fileInputRef}
                      onChange={e => setHeicFile(e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                    />
                    <UploadCloud size={20} style={{ color: 'oklch(0.50 0.01 250)' }} />
                    <span style={{ fontSize: 12, color: 'white', fontWeight: 550 }}>
                      {heicFile ? heicFile.name : 'Select HEIC Photo'}
                    </span>
                    <span style={{ fontSize: 10, color: 'oklch(0.50 0.01 250)' }}>
                      {heicFile ? `${(heicFile.size / 1024 / 1024).toFixed(2)} MB` : 'Drag and drop file here'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>TARGET FORMAT</label>
                    <select
                      value={heicFormat}
                      onChange={e => setHeicFormat(e.target.value as any)}
                      style={{
                        width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)',
                        borderRadius: 8, padding: 8, color: 'white', fontSize: 12.5, outline: 'none'
                      }}
                    >
                      <option value="jpg">Convert to JPG</option>
                      <option value="png">Convert to PNG</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>COMPRESSION QUALITY</label>
                    <select
                      value={heicQuality}
                      onChange={e => setHeicQuality(e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)',
                        borderRadius: 8, padding: 8, color: 'white', fontSize: 12.5, outline: 'none'
                      }}
                    >
                      <option value="0.95">High (95%)</option>
                      <option value="0.80">Medium (80%)</option>
                      <option value="0.50">Low (50%)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* PDF sandbox body fields */}
            {slug === 'html-to-print-ready-pdf' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>HTML CONTENT BODY</label>
                  <textarea
                    rows={4}
                    value={pdfHtml}
                    onChange={e => setPdfHtml(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)',
                      borderRadius: 8, padding: 10, color: 'white', fontSize: 12.5, fontFamily: 'monospace', outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={executeSandbox}
              disabled={loading}
              className="reset mono"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 0', fontSize: 13, fontWeight: 700, borderRadius: 8,
                background: 'oklch(0.68 0.18 265)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px oklch(0.68 0.18 265 / 0.25)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'oklch(0.72 0.18 265)'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'oklch(0.68 0.18 265)'; }}
            >
              {loading ? <Loader className="spin" size={13} /> : <Play size={11} />}
              {loading ? 'Executing request...' : 'Test Sandbox Query'}
            </button>
          </div>

          {/* Sandbox Response Console Terminal */}
          <div style={{
            background: '#0a0b0d',
            border: '1px solid #1a1c23',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column',
            minHeight: 340,
          }}>
            {/* VS Code Window Title Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#0f1115',
              padding: '10px 16px',
              borderBottom: '1px solid #1a1c23',
              userSelect: 'none'
            }}>
              {/* Colored Circles */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
              </div>
              
              {/* Window title tab */}
              <div style={{
                fontSize: 11,
                fontFamily: 'monospace',
                color: '#7e8394',
                background: '#0a0b0d',
                padding: '4px 12px',
                borderRadius: '6px 6px 0 0',
                border: '1px solid #1a1c23',
                borderBottom: 'none',
                marginBottom: -11,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Code size={11} style={{ color: api.color || 'oklch(0.68 0.18 265)' }} />
                <span>sandbox-response.json</span>
              </div>

              {/* Utility actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                {resBody && (
                  <button
                    onClick={handleCopyResponse}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copiedResponse ? 'oklch(0.78 0.16 145)' : '#7e8394',
                      cursor: 'pointer',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {copiedResponse ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                    <span>{copiedResponse ? 'Copied!' : 'Copy'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Response status bar */}
            {resStatus !== null && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                background: 'rgba(15, 17, 21, 0.4)',
                borderBottom: '1px solid #16181f',
                fontSize: 11,
                fontFamily: 'monospace',
              }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  {/* Status Indicator */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 700,
                    color: resStatus < 300 ? 'oklch(0.78 0.16 145)' : 'oklch(0.70 0.12 15)',
                    background: resStatus < 300 ? 'rgba(39, 201, 63, 0.1)' : 'rgba(255, 95, 86, 0.1)',
                    padding: '2px 8px',
                    borderRadius: 4
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: resStatus < 300 ? 'oklch(0.78 0.16 145)' : 'oklch(0.70 0.12 15)',
                      boxShadow: resStatus < 300 ? '0 0 8px oklch(0.78 0.16 145)' : '0 0 8px oklch(0.70 0.12 15)'
                    }} />
                    {resStatus} {resStatus < 300 ? 'OK' : 'Error'}
                  </span>

                  {resTime !== null && (
                    <span style={{ color: 'oklch(0.70 0.01 250)' }}>
                      Latency: <strong style={{ color: 'white' }}>{resTime}ms</strong>
                    </span>
                  )}
                </div>

                {/* Console tabs: Body vs Headers */}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setActiveConsoleTab('body')}
                    style={{
                      background: activeConsoleTab === 'body' ? '#1c1d22' : 'transparent',
                      border: 'none',
                      color: activeConsoleTab === 'body' ? 'white' : '#7e8394',
                      padding: '2px 8px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 10.5,
                      fontWeight: 600
                    }}
                  >
                    Response
                  </button>
                  <button
                    onClick={() => setActiveConsoleTab('headers')}
                    style={{
                      background: activeConsoleTab === 'headers' ? '#1c1d22' : 'transparent',
                      border: 'none',
                      color: activeConsoleTab === 'headers' ? 'white' : '#7e8394',
                      padding: '2px 8px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 10.5,
                      fontWeight: 600
                    }}
                  >
                    Headers
                  </button>
                </div>
              </div>
            )}

            {/* Sandbox Response Content body */}
            <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', background: '#07080a', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, margin: 'auto', color: api.color || 'oklch(0.68 0.18 265)' }}>
                  <Loader size={24} className="spin" />
                  <span style={{ fontSize: 12.5, fontFamily: 'monospace', letterSpacing: '0.02em' }}>Executing API Request...</span>
                </div>
              ) : resBody ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
                  
                  {activeConsoleTab === 'body' ? (
                    <>
                      <pre style={{
                        margin: 0,
                        fontFamily: 'monospace',
                        fontSize: 11.5,
                        lineHeight: 1.5,
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}>
                        <code>
                          {highlightJson(resBody)}
                        </code>
                      </pre>

                      {/* Converted Image preview */}
                      {resImgUrl && (
                        <div style={{ borderTop: '1px solid #1a1c23', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <span style={{ fontSize: 10.5, color: api.color || 'oklch(0.72 0.18 25)', fontWeight: 600, fontFamily: 'monospace' }}>Generated Image Output:</span>
                          <img src={resImgUrl} alt="Converted sandbox output" style={{ maxWidth: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 6, border: '1px solid #1a1c23' }} />
                          <a href={resImgUrl} download={`sandbox_result.${heicFormat}`} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5,
                            color: 'white', textDecoration: 'none', background: 'oklch(0.18 0.01 25 / 0.5)',
                            border: `1px solid ${api.color || 'oklch(0.72 0.18 25)'}33`, padding: '5px 12px', borderRadius: 6,
                            alignSelf: 'flex-start', transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = api.color || 'oklch(0.72 0.18 25)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = `${api.color || 'oklch(0.72 0.18 25)'}33`}
                          >
                            <FileDown size={11} /> Download Result Image
                          </a>
                        </div>
                      )}

                      {/* Converted PDF preview/download link */}
                      {resPdfUrl && (
                        <div style={{ borderTop: '1px solid #1a1c23', paddingTop: 14 }}>
                          <a href={resPdfUrl} download="sandbox_document.pdf" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5,
                            color: 'white', textDecoration: 'none', background: 'oklch(0.18 0.01 25 / 0.5)',
                            border: `1px solid ${api.color || 'oklch(0.68 0.18 265)'}33`, padding: '6px 14px', borderRadius: 6,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = api.color || 'oklch(0.68 0.18 265)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = `${api.color || 'oklch(0.68 0.18 265)'}33`}
                          >
                            <FileDown size={11} /> Download Generated PDF Document
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <pre style={{
                      margin: 0,
                      fontFamily: 'monospace',
                      fontSize: 11.5,
                      lineHeight: 1.5,
                      overflowX: 'auto',
                      whiteSpace: 'pre-wrap'
                    }}>
                      <code>
                        {highlightJson({
                          'content-type': 'application/json; charset=utf-8',
                          'cache-control': 'no-store, max-age=0',
                          'x-powered-by': 'Next.js',
                          'x-ratelimit-limit': slug === 'json-formatter-validator' || slug === 'universal-ai-formatter' ? '10' : '3',
                          'x-ratelimit-remaining': '9',
                          'x-ratelimit-reset': '60',
                          'server': 'Vercel/Edge',
                          'access-control-allow-origin': '*',
                          'x-response-time': resTime ? `${resTime}ms` : '0ms'
                        })}
                      </code>
                    </pre>
                  )}
                  
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, height: '100%', margin: '40px auto', color: '#4b5563', textAlign: 'center' }}>
                  <Terminal size={32} style={{ color: `${api.color || 'oklch(0.68 0.18 265)'}50` }} />
                  <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'oklch(0.50 0.01 250)' }}>
                    $ bin/sandbox --ping --endpoint={api.endpoint}
                  </span>
                  <span style={{ fontSize: 11.5, maxWidth: 300, color: 'oklch(0.50 0.01 250 / 0.8)' }}>
                    Execute the sandbox query above to initiate a sandbox stream and capture the response console details.
                  </span>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Matrix animation styling */}
      <style jsx global>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
